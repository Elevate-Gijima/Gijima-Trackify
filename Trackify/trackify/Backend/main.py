from fastapi import FastAPI, Depends, HTTPException, Query, Header, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError

import os

from database import engine, Base, get_db
import models, schemas, crud
from schemas import LoginRequest, TokenResponse, LogoutResponse
from schemas import DepartmentResponse, DepartmentCreate, EmployeeResponse, TimesheetResponse

from routers import auth, timesheet, manager, department, employee
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from models import StatusEnum as TimesheetStatusEnum

# ------------------------------------------------------------
# FastAPI App Initialization
# ------------------------------------------------------------
app = FastAPI(title="Gijima Timesheet API")

# ------------------------------------------------------------
# CORS Configuration
# ------------------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Specific origins allowed
    allow_credentials=True,
    allow_methods=["*"],         # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],         # Allow all headers
)

# ------------------------------------------------------------
# Include Routers
# ------------------------------------------------------------
app.include_router(auth.router)
app.include_router(timesheet.router)
app.include_router(manager.router, prefix="/manager", tags=["manager"])
app.include_router(department.router, prefix="/admin", tags=["admin"])
app.include_router(employee.router)

# ------------------------------------------------------------
# Create Tables
# ------------------------------------------------------------
Base.metadata.create_all(bind=engine)

# ------------------------------------------------------------
# JWT: Get Current User Dependency
# ------------------------------------------------------------
def get_current_user(Authorization: str = Header(...), db: Session = Depends(get_db)):
    if not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = Authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    user = db.query(EmployeeModel).filter(EmployeeModel.employee_id == str(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def admin_or_mentor_required(current_user: EmployeeModel = Depends(get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only admins and mentors can perform this action")
    return current_user

# ---------- Employee Endpoints ----------
@app.post("/employees/", response_model=schemas.EmployeeResponse)
def add_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add employees")
    try:
        return crud.create_employee(db, employee)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



# ---------- Authentication Endpoints ----------
@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user.employee_id, "exp": expire}  # employee_id is string
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "role": user.role,          # Add this
        "name": user.name,
        "surname": user.surname      # Add this (or user.name if that’s your field)
    }


@app.post("/logout", response_model=LogoutResponse)
def logout():
    # In stateless JWT, logout is client-side (token delete). Return success msg.
    return LogoutResponse(message="Logged out successfully. Please discard your token on the client.")

# ---------- Department Endpoints ----------
@app.post("/departments/", response_model=DepartmentResponse)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    db_department = DepartmentModel(name=department.name)
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

@app.get("/departments/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db), current_user: EmployeeModel = Depends(get_current_user)):
    return db.query(DepartmentModel).all()

# --- Endpoints to get employees for admin ---
@app.get("/admin/employees", response_model=list[schemas.EmployeeResponse])
def get_all_employees_for_admin(db: Session = Depends(get_db), current_user: EmployeeModel = Depends(get_current_user)):
    return db.query(EmployeeModel).all()

# ---------- Employee Update Endpoint ----------
@app.put("/employees/{employee_id}", response_model=schemas.EmployeeResponse)
def update_employee_details(
    employee_id: str,
    employee_update: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """Update employee details - anyone can update any employee."""
    try:
        return crud.update_employee(db, employee_id, employee_update)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Department-specific employee endpoint removed - use /mentor/employees instead

# ---------- Mentor's Department Employees ----------
@app.get("/manager/employees", response_model=list[schemas.EmployeeResponse])
def get_mentor_employees(
    role: str = Query(None, description="Filter by employee role (employee, manager, admin)"),
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """Get employees in mentor's department, optionally filtered by role."""
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can access this endpoint")
    
    # Get employees in the mentor's department
    employees = crud.get_employees_by_department(db, current_user.department_name)
    
    # Filter by role if provided
    if role:
        employees = [emp for emp in employees if emp.role == role]
    
    return employees

# ---------- Timesheet Endpoints ----------
@app.post("/timesheets/", response_model=TimesheetResponse)
def create_timesheet(
    timesheet: TimesheetCreate,
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """Create a timesheet entry - employees can create their own timesheets."""
    if current_user.role != "employee":
        raise HTTPException(status_code=403, detail="Only employees can create timesheets")
    from datetime import date as dtdate
    if timesheet.date > dtdate.today():
        raise HTTPException(status_code=400, detail="Cannot submit timesheet for a future date")
    try:
        return crud.create_timesheet(db, current_user.employee_id, timesheet)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/timesheets/{employee_id}/{date}", response_model=TimesheetResponse)
def get_timesheet(
    employee_id: str,
    date: str,
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """Get a specific timesheet entry."""
    # Check permissions
    if current_user.role == "employee" and current_user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Employees can only view their own timesheets")
    elif current_user.role == "manager":
        # Check if employee is in mentor's department
        employee = db.query(EmployeeModel).filter(EmployeeModel.employee_id == employee_id).first()
        if not employee or employee.department_name != current_user.department_name:
            raise HTTPException(status_code=403, detail="Managers can only view timesheets from their department")
    
    timesheet = crud.get_timesheet(db, employee_id, date)
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return timesheet

@app.put("/timesheets/{timesheet_id}", response_model=TimesheetResponse)
def update_timesheet(
    timesheet_id: int,
    timesheet_update: TimesheetUpdate,
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """Update a timesheet entry - employees can edit their own timesheets only, mentors/admins with permissions."""
    timesheet = db.query(TimesheetModel).filter(TimesheetModel.timesheet_id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    # Permissions:
    if current_user.role == "employee":
        if timesheet.employee_id != current_user.employee_id:
            raise HTTPException(status_code=403, detail="Employees can only edit their own timesheets")
    elif current_user.role == "manager":
        # Check that timesheet employee is in mentor's department
        employee = db.query(EmployeeModel).filter(EmployeeModel.employee_id == timesheet.employee_id).first()
        if not employee or employee.department_name != current_user.department_name:
            raise HTTPException(status_code=403, detail="Manager can only edit timesheets from their department")
    # If passed, update
    try:
        return crud.update_timesheet(db, timesheet.employee_id, timesheet.date, timesheet_update)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/timesheets/", response_model=list[TimesheetResponse])
def get_timesheets(
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """Get timesheets based on user role."""
    if current_user.role == "admin":
        # Administrators can view all timesheets
        return crud.get_all_timesheets(db)
    elif current_user.role == "manager":
        # Mentors can view timesheets from their department
        return crud.get_mentor_department_timesheets(db, current_user.department_name)
    else:
        # Employees can only view their own timesheets
        return crud.get_employee_timesheets(db, current_user.employee_id)

@app.get("/manager/timesheets", response_model=list[TimesheetResponse])
def get_manager_timesheets(
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected"),
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """Return timesheets for employees in the manager's department, optional status filter."""
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can access this endpoint")

    query = db.query(TimesheetModel).join(EmployeeModel, EmployeeModel.employee_id == TimesheetModel.employee_id).filter(
        EmployeeModel.department_name == current_user.department_name
    )

    if status is not None:
        normalized = str(status).lower()
        valid = {"pending", "approved", "rejected"}
        if normalized not in valid:
            raise HTTPException(status_code=400, detail="Invalid status value. Use pending, approved, or rejected")
        # Compare against Enum value to avoid string/enum mismatch
        enum_value = TimesheetStatusEnum(normalized)
        query = query.filter(TimesheetModel.status == enum_value)

    return query.all()

@app.put("/employees/{employee_id}/status", response_model=schemas.EmployeeResponse)
def update_employee_status(
    employee_id: str,
    status_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """
    Allows MANAGERS and ADMINS to update employee status.
    """
    # Only managers or admins can change status
    if current_user.role not in ["manager", "administrator"]:
        raise HTTPException(status_code=403, detail="Only managers or administrators can change status.")

    # Get employee from DB
    employee = db.query(EmployeeModel).filter(EmployeeModel.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    # Validate and update status
    new_status = status_data.get("status")
    if new_status not in ["Approved", "Rejected", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid status value.")

    employee.status = new_status
    db.commit()
    db.refresh(employee)

    return employee


@app.put("/employees/{employee_id}/timesheets/status")
def update_all_timesheets_status_for_employee(
    employee_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """
    Bulk update: Approve/Reject/Pending all timesheets for an employee.
    Managers can only act within their department; admins can act globally.
    """
    # Permission checks
    if current_user.role not in ["manager", "admin", "administrator"]:
        raise HTTPException(status_code=403, detail="Only managers or admins can change timesheets status.")

    # If manager, ensure employee is in same department
    if current_user.role == "manager":
        emp = db.query(EmployeeModel).filter(EmployeeModel.employee_id == employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        if emp.department_name != current_user.department_name:
            raise HTTPException(status_code=403, detail="Managers can only update timesheets within their department")

    # Validate status
    new_status = payload.get("status")
    valid_values = {"approved", "rejected", "pending"}
    if not new_status or str(new_status).lower() not in valid_values:
        raise HTTPException(status_code=400, detail="Invalid status value. Use approved/rejected/pending.")
    new_status = str(new_status).lower()

    # Update all timesheets for employee
    timesheets = db.query(TimesheetModel).filter(TimesheetModel.employee_id == employee_id).all()
    if not timesheets:
        return {"updated": 0}

    for ts in timesheets:
        ts.status = new_status  # SQLAlchemy Enum will coerce if necessary
    db.commit()

    return {"updated": len(timesheets)}

@app.get("/employees/approved", response_model=list[schemas.EmployeeResponse])
def get_approved_employees(
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view approved employees")

    approved_employees = db.query(EmployeeModel).filter(EmployeeModel.status == "approved").all()
    return approved_employees

