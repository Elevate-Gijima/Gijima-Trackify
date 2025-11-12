from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from models import Employee
from schemas import Token, Login
from utils import verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/login", response_model=Token)
def login_user(login: Login, db: Session = Depends(get_db)):
    user = db.query(Employee).filter(Employee.email == login.email).first()
    if not user or not verify_password(login.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
