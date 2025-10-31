from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from jose import JWTError, jwt
from config import SECRET_KEY, ALGORITHM
from fastapi import Header
from typing import Optional

router = APIRouter()

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id: str = payload.get("sub")
        if employee_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.get("/employees", response_model=list[schemas.EmployeeResponse])
def get_department_employees(
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user)
):
    # Check if user is a manager
    role_str = str(current_user.role)
    if role_str != "RoleEnum.manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can access department employees"
        )
    
    # Get manager's department
    if not current_user.department_name:
        print("DEBUG: Manager has no department assigned")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Manager has no department assigned"
        )
    
    # Get employees from the same department with role 'employee'
    employees = db.query(models.Employee).filter(
        models.Employee.department_name == current_user.department_name,
        models.Employee.role == "employee"
    ).all()
    
    return employees

@router.put("/employees/{employee_id}/timesheets/status")
def update_employee_timesheets_status(
    employee_id: str,
    status_update: schemas.TimesheetStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user)
):
    # Check if user is a manager
    if current_user.role != models.RoleEnum.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can update timesheet statuses"
        )
    
    # Get manager's department
    if not current_user.department_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Manager has no department assigned"
        )
    
    # Verify the employee belongs to the manager's department
    employee = db.query(models.Employee).filter(
        models.Employee.employee_id == employee_id,
        models.Employee.department_name == current_user.department_name,
        models.Employee.role == models.RoleEnum.employee
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in your department"
        )
    
    # Update all pending timesheets for this employee
    new_status = status_update.status
    if new_status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'approved' or 'rejected'"
        )
    
    # Get all pending timesheets for this employee
    timesheets = db.query(models.Timesheet).filter(
        models.Timesheet.employee_id == employee_id,
        models.Timesheet.status == models.StatusEnum.pending
    ).all()
    
    # Update their status
    updated_count = 0
    for timesheet in timesheets:
        timesheet.status = models.StatusEnum(new_status)
        updated_count += 1
    
    db.commit()
    
    return {"updated": updated_count, "message": f"Updated {updated_count} timesheet(s) to {new_status}"}
