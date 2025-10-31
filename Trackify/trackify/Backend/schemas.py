from pydantic import BaseModel
from typing import Optional
from datetime import date, time


# ===================== Authentication =====================
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class LogoutResponse(BaseModel):
    message: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    name: str
    surname: str
    email: str
    role: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ForgotPasswordResponse(BaseModel):
    message: str


# ===================== User / Employee =====================
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class EmployeeCreate(UserBase):
    employee_id: Optional[str]
    password: str
    name: str
    surname: str
    role: str
    department_name: Optional[str]

class EmployeeResponse(UserBase):
    employee_id: str
    name: str
    surname: str
    role: str
    department_name: Optional[str]

    class Config:
        from_attributes = True

class TimesheetStatusUpdate(BaseModel):
    status: str


class EmployeeUpdate(BaseModel):
    name: Optional[str]
    surname: Optional[str]
    email: Optional[str]
    role: Optional[str]
    department_name: Optional[str]


# ===================== Department =====================
class DepartmentCreate(BaseModel):
    name: str

class DepartmentResponse(BaseModel):
    department_id: int
    name: str

    class Config:
        from_attributes = True

class TimesheetStatusUpdate(BaseModel):
    status: str


# ===================== Timesheet =====================
class TimesheetCreate(BaseModel):
    date: date
    clock_in: time
    clock_out: time
    description: Optional[str]

class TimesheetUpdate(BaseModel):
    clock_in: Optional[time]
    clock_out: Optional[time]
    description: Optional[str]
    status: Optional[str]

class TimesheetResponse(BaseModel):
    timesheet_id: int
    employee_id: int
    date: date
    clock_in: time
    clock_out: time
    total_hours: Optional[float]
    status: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True

class TimesheetStatusUpdate(BaseModel):
    status: str


class TimesheetWithEmployeeInfoResponse(BaseModel):
    timesheet_id: int
    employee_id: str
    employee_name: str
    employee_surname: str
    employee_email: str
    employee_department: Optional[str]
    date: date
    clock_in: time
    clock_out: time
    total_hours: Optional[float]
    status: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True

class TimesheetStatusUpdate(BaseModel):
    status: str
