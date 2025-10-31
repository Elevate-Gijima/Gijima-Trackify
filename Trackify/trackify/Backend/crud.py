# crud.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
import models
from datetime import datetime
from uuid import uuid4

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


# ===================== User Authentication =====================
def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except UnknownHashError:
        # Fallback for legacy plaintext or unknown formats
        return plain_password == hashed_password

def get_password_hash(password):
    # Use pbkdf2_sha256 for new hashes to avoid bcrypt's 72-byte input limit
    try:
        return pwd_context.hash(password, scheme="pbkdf2_sha256")
    except Exception:
        # Fallback to default behavior if explicit scheme fails
        return pwd_context.hash(password)

def get_user_by_email(db: Session, email: str):
    normalized = (email or "").strip().lower()
    return db.query(models.Employee).filter(func.lower(models.Employee.email) == normalized).first()

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    # Prefer password_hash if available; fallback to legacy plain-text field if present
    stored_hash = getattr(user, "password_hash", None)
    if stored_hash:
        try:
            if not verify_password(password, stored_hash):
                return None
        except Exception as e:
            return None
    else:
        legacy_plain = getattr(user, "password", None)
        if legacy_plain is None or legacy_plain != password:
            return None
    
    return user


# ===================== Employee CRUD =====================
def get_employee_by_id(db: Session, employee_id: str):
    return db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()


def create_employee(db: Session, employee):
    hashed_password = get_password_hash(employee.password)
    # Coerce role to RoleEnum for DB integrity
    try:
        role_value = models.RoleEnum(employee.role) if not isinstance(employee.role, models.RoleEnum) else employee.role
    except Exception:
        # Default to employee if invalid role provided
        role_value = models.RoleEnum.employee

    # Generate an employee_id if missing/blank
    provided_id = getattr(employee, "employee_id", None)
    employee_id = (provided_id or "").strip() or ("EMP" + uuid4().hex[:12].upper())

    db_employee = models.Employee(
        employee_id=employee_id,
        email=employee.email,
        password_hash=hashed_password,
        name=employee.name,
        surname=employee.surname,
        role=role_value,
        department_name=employee.department_name
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def update_employee(db: Session, employee_id: str, update_data):
    emp = db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()
    if not emp:
        raise ValueError("Employee not found")
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return emp


# ===================== Department CRUD =====================
def create_department(db: Session, department):
    db_department = models.Department(name=department.name)
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

def get_employees_by_department(db: Session, department_name: str):
    return db.query(models.Employee).filter(models.Employee.department_name == department_name).all()


# ===================== Timesheet CRUD =====================
def create_timesheet(db: Session, employee_id: str, timesheet):
    # Calculate total hours
    clock_in_datetime = datetime.combine(timesheet.date, timesheet.clock_in)
    clock_out_datetime = datetime.combine(timesheet.date, timesheet.clock_out)
    total_hours = (clock_out_datetime - clock_in_datetime).total_seconds() / 3600
    
    db_timesheet = models.Timesheet(
        employee_id=employee_id,
        date=timesheet.date,
        clock_in=timesheet.clock_in,
        clock_out=timesheet.clock_out,
        total_hours=total_hours,
        status=models.StatusEnum.pending,
        description=timesheet.description
    )
    db.add(db_timesheet)
    db.commit()
    db.refresh(db_timesheet)
    return db_timesheet

def get_timesheet(db: Session, employee_id: str, date):
    return db.query(models.Timesheet).filter(
        models.Timesheet.employee_id == employee_id,
        models.Timesheet.date == date
    ).first()

def update_timesheet(db: Session, employee_id: str, date, update_data):
    ts = db.query(models.Timesheet).filter(
        models.Timesheet.employee_id == employee_id,
        models.Timesheet.date == date
    ).first()
    if not ts:
        raise ValueError("Timesheet not found")
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(ts, key, value)
    db.commit()
    db.refresh(ts)
    return ts

def get_all_timesheets(db: Session):
    return db.query(models.Timesheet).all()

def get_employee_timesheets(db: Session, employee_id: str):
    return db.query(models.Timesheet).filter(models.Timesheet.employee_id == employee_id).all()

def get_mentor_department_timesheets(db: Session, department_name: str):
    return db.query(models.Timesheet).join(models.Employee).filter(
        models.Employee.department_name == department_name
    ).all()
