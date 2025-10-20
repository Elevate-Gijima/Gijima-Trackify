from fastapi import FastAPI, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
import models, schemas, crud
from database import engine, Base, get_db
from schemas import DepartmentCreate, DepartmentResponse, LoginRequest, TokenResponse, LogoutResponse, EmployeeUpdate, TimesheetCreate, TimesheetUpdate, TimesheetResponse
from jose import jwt
from datetime import datetime, timedelta
from crud import authenticate_user
import os
from fastapi import status
from jose import JWTError
from models import Employee as EmployeeModel, Department as DepartmentModel, Timesheet as TimesheetModel

# Create tables
Base.metadata.create_all(bind=engine)



app = FastAPI(title="Gijima Timesheet API")


origins=[
    "http://localhost:3000"
]
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Can also use ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],    # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],    # Allows all headers
)
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "a_very_secret_key")  # In .env or fallback
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Dependency to extract and validate user from JWT
def get_current_user(Authorization: str = Header(...), db: Session = Depends(get_db)):
    if not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = Authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")  # employee_id is now string, not int
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    user = db.query(EmployeeModel).filter(EmployeeModel.employee_id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def admin_or_mentor_required(current_user: EmployeeModel = Depends(get_current_user)):
    if current_user.role not in ["administrator", "mentor"]:
        raise HTTPException(status_code=403, detail="Only admins and mentors can perform this action")
    return current_user

# ---------- Employee Endpoints ----------
@app.post("/employees/", response_model=schemas.EmployeeResponse)
def add_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(admin_or_mentor_required)
):
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
        "name": user.full_name      # Add this (or user.name if that’s your field)
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
@app.get("/mentor/employees", response_model=list[schemas.EmployeeResponse])
def get_mentor_employees(
    role: str = Query(None, description="Filter by employee role (employee, mentor, administrator)"),
    db: Session = Depends(get_db),
    current_user: EmployeeModel = Depends(get_current_user)
):
    """Get employees in mentor's department, optionally filtered by role."""
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can access this endpoint")
    
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
    elif current_user.role == "mentor":
        # Check if employee is in mentor's department
        employee = db.query(EmployeeModel).filter(EmployeeModel.employee_id == employee_id).first()
        if not employee or employee.department_name != current_user.department_name:
            raise HTTPException(status_code=403, detail="Mentors can only view timesheets from their department")
    
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
    elif current_user.role == "mentor":
        # Check that timesheet employee is in mentor's department
        employee = db.query(EmployeeModel).filter(EmployeeModel.employee_id == timesheet.employee_id).first()
        if not employee or employee.department_name != current_user.department_name:
            raise HTTPException(status_code=403, detail="Mentors can only edit timesheets from their department")
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
    if current_user.role == "administrator":
        # Administrators can view all timesheets
        return crud.get_all_timesheets(db)
    elif current_user.role == "mentor":
        # Mentors can view timesheets from their department
        return crud.get_mentor_department_timesheets(db, current_user.department_name)
    else:
        # Employees can only view their own timesheets
        return crud.get_employee_timesheets(db, current_user.employee_id)
