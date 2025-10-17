from sqlalchemy.orm import Session
from models import Employee, Department, Timesheet, StatusEnum
from schemas import EmployeeCreate, EmployeeUpdate, TimesheetCreate, TimesheetUpdate
from passlib.context import CryptContext
from datetime import datetime, timedelta

# Configure password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# ---------- Helper Functions ----------

def hash_password(password: str):
    """Hash a plain-text password using pbkdf2_sha256."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ---------- Authentication ----------

def authenticate_user(db: Session, email: str, password: str):
    """
    Authenticate a user by verifying their email and password.
    Returns the Employee object if successful, otherwise None.
    """
    user = db.query(Employee).filter(Employee.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


# ---------- Employee CRUD ----------

def create_employee(db: Session, employee: EmployeeCreate):
    """
    Create a new employee with hashed password.
    Ensures email and employee_id are unique.
    """
    if db.query(Employee).filter(Employee.email == employee.email).first():
        raise ValueError("Email already exists")

    if db.query(Employee).filter(Employee.employee_id == employee.employee_id).first():
        raise ValueError("Employee ID already exists")

    db_employee = Employee(
        employee_id=employee.employee_id,
        name=employee.name,
        surname=employee.surname,
        email=employee.email,
        password_hash=hash_password(employee.password),
        role=employee.role,
        department_name=employee.department_name
    )

    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


def get_employees(db: Session):
    """Return all employees."""
    return db.query(Employee).all()


def get_employee_by_email(db: Session, email: str):
    """Return a single employee by email."""
    return db.query(Employee).filter(Employee.email == email).first()


def get_department_for_employee(db: Session, employee: Employee):
    """Look up the department object by employee's department_name (non-FK)."""
    return db.query(Department).filter(Department.name == employee.department_name).first()


def update_employee(db: Session, employee_id: str, employee_update: EmployeeUpdate):
    """Update employee details."""
    db_employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not db_employee:
        raise ValueError("Employee not found")
    
    # Update only provided fields
    if employee_update.name is not None:
        db_employee.name = employee_update.name
    if employee_update.surname is not None:
        db_employee.surname = employee_update.surname
    if employee_update.email is not None:
        # Check if new email already exists
        existing_employee = db.query(Employee).filter(Employee.email == employee_update.email, Employee.employee_id != employee_id).first()
        if existing_employee:
            raise ValueError("Email already exists")
        db_employee.email = employee_update.email
    if employee_update.password is not None:
        db_employee.password_hash = hash_password(employee_update.password)
    if employee_update.department_name is not None:
        db_employee.department_name = employee_update.department_name
    
    db.commit()
    db.refresh(db_employee)
    return db_employee


def get_employees_by_department(db: Session, department_name: str):
    """Get all employees that belong to a specific department."""
    return db.query(Employee).filter(Employee.department_name == department_name).all()


# ---------- Timesheet CRUD ----------

def create_timesheet(db: Session, employee_id: str, timesheet: TimesheetCreate):
    """Create a new timesheet entry."""
    # Check if timesheet already exists for this employee and date
    existing = db.query(Timesheet).filter(
        Timesheet.employee_id == employee_id,
        Timesheet.date == timesheet.date
    ).first()
    if existing:
        raise ValueError("Timesheet already exists for this date")
    
    # Calculate total hours
    clock_in_dt = datetime.combine(timesheet.date, timesheet.clock_in)
    clock_out_dt = datetime.combine(timesheet.date, timesheet.clock_out)
    total_hours = (clock_out_dt - clock_in_dt).total_seconds() / 3600
    
    db_timesheet = Timesheet(
        employee_id=employee_id,
        date=timesheet.date,
        description=timesheet.description,
        clock_in=timesheet.clock_in,
        clock_out=timesheet.clock_out,
        total_hours=round(total_hours, 2),
        status=StatusEnum.pending
    )
    
    db.add(db_timesheet)
    db.commit()
    db.refresh(db_timesheet)
    return db_timesheet

def get_timesheet(db: Session, employee_id: str, date: str):
    """Get a specific timesheet entry."""
    return db.query(Timesheet).filter(
        Timesheet.employee_id == employee_id,
        Timesheet.date == date
    ).first()

def update_timesheet(db: Session, employee_id: str, date: str, timesheet_update: TimesheetUpdate):
    """Update a timesheet entry."""
    db_timesheet = db.query(Timesheet).filter(
        Timesheet.employee_id == employee_id,
        Timesheet.date == date
    ).first()
    
    if not db_timesheet:
        raise ValueError("Timesheet not found")
    
    # Update only provided fields
    if timesheet_update.description is not None:
        db_timesheet.description = timesheet_update.description
    if timesheet_update.clock_in is not None:
        db_timesheet.clock_in = timesheet_update.clock_in
    if timesheet_update.clock_out is not None:
        db_timesheet.clock_out = timesheet_update.clock_out
    if timesheet_update.status is not None:
        db_timesheet.status = timesheet_update.status
    
    # Recalculate total hours if clock times changed
    if timesheet_update.clock_in is not None or timesheet_update.clock_out is not None:
        clock_in = timesheet_update.clock_in if timesheet_update.clock_in else db_timesheet.clock_in
        clock_out = timesheet_update.clock_out if timesheet_update.clock_out else db_timesheet.clock_out
        clock_in_dt = datetime.combine(db_timesheet.date, clock_in)
        clock_out_dt = datetime.combine(db_timesheet.date, clock_out)
        total_hours = (clock_out_dt - clock_in_dt).total_seconds() / 3600
        db_timesheet.total_hours = round(total_hours, 2)
    
    db.commit()
    db.refresh(db_timesheet)
    return db_timesheet

def get_all_timesheets(db: Session):
    """Get all timesheets (for administrators)."""
    return db.query(Timesheet).all()

def get_mentor_department_timesheets(db: Session, department_name: str):
    """Get timesheets for employees in mentor's department."""
    return db.query(Timesheet).join(Employee).filter(
        Employee.department_name == department_name
    ).all()

def get_employee_timesheets(db: Session, employee_id: str):
    """Get all timesheets for a specific employee."""
    return db.query(Timesheet).filter(Timesheet.employee_id == employee_id).all()
