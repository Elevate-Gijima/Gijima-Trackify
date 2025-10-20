from sqlalchemy import Column, Integer, String, Enum, Date, Time, DECIMAL, Text, ForeignKey
from database import Base
import enum


# ---------- ENUMS ----------
class RoleEnum(str, enum.Enum):
    employee = "employee"
    manager = "manager"
    administrator = "administrator"

class StatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


# ---------- DEPARTMENT ----------
class Department(Base):
    __tablename__ = "department"
    department_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)


# ---------- EMPLOYEE ----------
class Employee(Base):
    __tablename__ = "employee"
    employee_id = Column(String(20), primary_key=True, nullable=False)
    name = Column(String(100), nullable=False)
    surname = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    department_name = Column(String(100))  # Non-FK, links by name only

# ---------- TIMESHEET ----------
class Timesheet(Base):
    __tablename__ = "timesheet"
    timesheet_id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(20), ForeignKey("employee.employee_id"))
    date = Column(Date)
    description = Column(Text)
    clock_in = Column(Time)
    clock_out = Column(Time)
    total_hours = Column(DECIMAL(5, 2))
    status = Column(Enum(StatusEnum), default=StatusEnum.pending)
