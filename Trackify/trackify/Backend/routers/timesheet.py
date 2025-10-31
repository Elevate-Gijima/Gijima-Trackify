# routers/timesheet.py
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import date, time, datetime
from typing import Optional, Union
from jose import jwt, JWTError
from sqlalchemy.orm import joinedload

from database import get_db
from schemas import TimesheetCreate, TimesheetResponse, TimesheetWithEmployeeInfoResponse, TimesheetUpdate

from crud import (create_timesheet,get_timesheet,get_employee_timesheets,get_mentor_department_timesheets,get_all_timesheets,)
from models import Employee, Timesheet, StatusEnum
from config import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/timesheets", tags=["Timesheets"])


def get_current_user(Authorization: str = Header(...), db: Session = Depends(get_db)):
    """Get current user from JWT token"""
    if not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = Authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    user = db.query(Employee).filter(Employee.employee_id == str(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/", response_model=Union[list[TimesheetResponse], list[TimesheetWithEmployeeInfoResponse]])
def list_timesheets(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Return timesheets based on role:
    - employee: only their own timesheets
    - manager: all timesheets in their department
    - admin/administrator: all timesheets with employee info
    """
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    if role_value == "employee":
        return get_employee_timesheets(db, current_user.employee_id)
    if role_value == "manager":
        if not current_user.department_name:
            return []
        return get_mentor_department_timesheets(db, current_user.department_name)
    if role_value in ("admin", "administrator"):
        # Admin: Join employee table and add info
        results = (
            db.query(Timesheet, Employee)
            .join(Employee, Timesheet.employee_id == Employee.employee_id)
            .all()
        )
        return [
            TimesheetWithEmployeeInfoResponse(
                timesheet_id=t.timesheet_id,
                employee_id=t.employee_id,
                employee_name=e.name,
                employee_surname=e.surname,
                employee_email=e.email,
                employee_department=e.department_name,
                date=t.date,
                clock_in=t.clock_in,
                clock_out=t.clock_out,
                total_hours=float(t.total_hours) if t.total_hours is not None else None,
                status=t.status.value if hasattr(t.status,'value') else str(t.status),
                description=t.description,
            )
            for t, e in results
        ]

    # Default: no access
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role not authorized to view timesheets")


@router.post("/", response_model=TimesheetResponse)
def create_timesheet_entry(
    timesheet_data: TimesheetCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Create a new timesheet entry for the authenticated user.
    
    Validations:
    - Only employees can create timesheets
    - Only one timesheet per day per employee
    - clock_out must be after clock_in
    - Automatically calculates total_hours
    """
    
    # Check if user is an employee
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role != 'employee':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can create timesheets"
        )
    
    # Check if timesheet already exists for this date and employee
    existing_timesheet = get_timesheet(db, current_user.employee_id, timesheet_data.date)
    if existing_timesheet:
        # Check if the existing timesheet is rejected
        existing_status = existing_timesheet.status.value if hasattr(existing_timesheet.status, 'value') else str(existing_timesheet.status)
        
        # If rejected, allow update by updating the existing timesheet
        if existing_status == "rejected":
            # Validate clock_out is after clock_in
            if timesheet_data.clock_out <= timesheet_data.clock_in:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Clock out time must be after clock in time"
                )
            
            # Calculate total hours
            clock_in_datetime = datetime.combine(timesheet_data.date, timesheet_data.clock_in)
            clock_out_datetime = datetime.combine(timesheet_data.date, timesheet_data.clock_out)
            total_hours = (clock_out_datetime - clock_in_datetime).total_seconds() / 3600
            
            # Update the rejected timesheet
            existing_timesheet.clock_in = timesheet_data.clock_in
            existing_timesheet.clock_out = timesheet_data.clock_out
            existing_timesheet.description = timesheet_data.description
            existing_timesheet.total_hours = total_hours
            existing_timesheet.status = StatusEnum.pending  # Reset to pending for review
            
            db.commit()
            db.refresh(existing_timesheet)
            return existing_timesheet
        else:
            # If not rejected, prevent duplicate
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Timesheet already exists for date {timesheet_data.date}. Only one timesheet per day is allowed."
            )
    
    # Validate clock_out is after clock_in
    if timesheet_data.clock_out <= timesheet_data.clock_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clock out time must be after clock in time"
        )
    
    # Calculate total hours
    clock_in_datetime = datetime.combine(timesheet_data.date, timesheet_data.clock_in)
    clock_out_datetime = datetime.combine(timesheet_data.date, timesheet_data.clock_out)
    total_hours = (clock_out_datetime - clock_in_datetime).total_seconds() / 3600
    
    # Create timesheet entry
    try:
        timesheet = create_timesheet(db, current_user.employee_id, timesheet_data)
        return timesheet
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create timesheet: {str(e)}"
        )
@router.put("/{timesheet_id}", response_model=TimesheetResponse)
def update_timesheet_entry(
    timesheet_id: int,
    update_data: TimesheetUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):

# Fetch the timesheet
    ts = db.query(Timesheet).filter(Timesheet.timesheet_id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    # Check permissions
    if role_value == "employee" and ts.employee_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="You can only update your own timesheets")

    # If both times are provided, validate order
    if update_data.clock_in and update_data.clock_out:
        if update_data.clock_out <= update_data.clock_in:
            raise HTTPException(status_code=400, detail="Clock out time must be after clock in time")

    # Update fields safely
    if update_data.clock_in:
        ts.clock_in = update_data.clock_in
    if update_data.clock_out:
        ts.clock_out = update_data.clock_out
    if update_data.description is not None:
        ts.description = update_data.description
    
    # Handle status updates
    if update_data.status and role_value in ("manager", "admin", "administrator"):
        # Only managers/admins can change status
        if update_data.status not in ("pending", "approved", "rejected"):
            raise HTTPException(status_code=400, detail="Invalid status value")
        ts.status = update_data.status
    elif role_value == "employee":
        # If employee updates a rejected timesheet, reset status to pending for review
        current_status = ts.status.value if hasattr(ts.status, 'value') else str(ts.status)
        if current_status == "rejected":
            ts.status = StatusEnum.pending

    # Recalculate total_hours if times changed
    if ts.clock_in and ts.clock_out:
        clock_in_datetime = datetime.combine(ts.date, ts.clock_in)
        clock_out_datetime = datetime.combine(ts.date, ts.clock_out)
        ts.total_hours = (clock_out_datetime - clock_in_datetime).total_seconds() / 3600

    # Commit changes
    db.commit()
    db.refresh(ts)

    return ts