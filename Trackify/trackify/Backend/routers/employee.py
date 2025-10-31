from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from database import get_db
from config import SECRET_KEY, ALGORITHM
import models
import schemas
import crud

router = APIRouter(prefix="/admin", tags=["admin"])


def get_current_user(Authorization: str = Header(...), db: Session = Depends(get_db)):
    if not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = Authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    user = db.query(models.Employee).filter(models.Employee.employee_id == str(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/employees", response_model=schemas.EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee_admin(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(get_current_user),
):
    """Create a new employee. Admin-only."""
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_value not in ("admin", "administrator"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create employees")

    # Validate required fields
    if not employee.email or not employee.password or not employee.name or not employee.surname:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Ensure email is unique
    existing = crud.get_user_by_email(db, employee.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already in use")

    # If employee_id provided and already exists, reject
    if getattr(employee, "employee_id", None):
        if crud.get_employee_by_id(db, employee.employee_id):
            raise HTTPException(status_code=409, detail="Employee ID already exists")

    try:
        created = crud.create_employee(db, employee)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {str(e)}")


