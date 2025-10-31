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

@router.get("/departments", response_model=list[schemas.DepartmentResponse])
def get_all_departments(
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user)
):
    """Get all departments - only accessible by admin/administrator"""
    # Check if user is admin/administrator
    role_str = str(current_user.role)
    if role_str not in ["RoleEnum.admin", "RoleEnum.administrator", "admin", "administrator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access department information"
        )
    
    # Get all departments
    departments = db.query(models.Department).all()
    return departments

@router.get("/departments/{department_name}/employees", response_model=list[schemas.EmployeeResponse])
def get_department_employees(
    department_name: str,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user)
):
    """Get all employees in a specific department - only accessible by admin/administrator"""
    # Check if user is admin/administrator
    role_str = str(current_user.role)
    if role_str not in ["RoleEnum.admin", "RoleEnum.administrator", "admin", "administrator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access department employee information"
        )
    
    # Check if department exists
    department = db.query(models.Department).filter(models.Department.name == department_name).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    # Get employees based on department
    if department_name.lower() == "hr":
        # For HR department, only show employees with role 'employee'
        employees = db.query(models.Employee).filter(
            models.Employee.department_name == department_name,
            models.Employee.role == "employee"
        ).all()
    else:
        # For other departments, show all employees
        employees = db.query(models.Employee).filter(
            models.Employee.department_name == department_name
        ).all()
    
    return employees
