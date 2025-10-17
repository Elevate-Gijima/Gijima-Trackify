from pydantic import BaseModel, EmailStr
from typing import Optional
from models import RoleEnum

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