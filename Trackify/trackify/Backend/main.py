from fastapi import FastAPI, Depends, HTTPException, Query, Header, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
import os

from database import engine, Base, get_db
import models, schemas, crud
from models import Employee as EmployeeModel, Department as DepartmentModel, Timesheet as TimesheetModel
from schemas import LoginRequest, TokenResponse, LogoutResponse
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

