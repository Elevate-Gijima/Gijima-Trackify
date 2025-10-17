from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, time
from models import RoleEnum, StatusEnum

# ---------- Employee Schemas ----------
class EmployeeCreate(BaseModel):
    employee_id: str
    name: str
    surname: str
    email: EmailStr
    password: str
    role: RoleEnum
    department_name: Optional[str] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    department_name: Optional[str] = None

class EmployeeResponse(BaseModel):
    employee_id: str
    name: str
    surname: str
    email: EmailStr
    role: RoleEnum
    department_name: Optional[str] = None

    class Config:
        from_attributes = True

# ---------- Department Schemas ----------
class DepartmentCreate(BaseModel):
    name: str

class DepartmentResponse(BaseModel):
    department_id: int
    name: str
    class Config:
        from_attributes = True

# ---------- Auth Schemas ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class LogoutResponse(BaseModel):
    message: str

# ---------- Timesheet Schemas ----------
class TimesheetCreate(BaseModel):
    date: date
    description: str
    clock_in: time
    clock_out: time

class TimesheetUpdate(BaseModel):
    description: Optional[str] = None
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    total_hours: Optional[float] = None
    status: Optional[StatusEnum] = None

class TimesheetResponse(BaseModel):
    timesheet_id: int
    employee_id: str
    date: date
    description: str
    clock_in: time
    clock_out: time
    total_hours: Optional[float] = None
    status: StatusEnum

    class Config:
        from_attributes = True