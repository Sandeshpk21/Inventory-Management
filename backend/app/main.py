from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from . import models, crud, schemas
from .routers import purchase_orders, requirements, stock, transactions
from .dependencies import get_db, get_current_user, require_role, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, oauth2_scheme

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory Management API",
    description="API for managing inventory, purchase orders, and transactions",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Include routers
app.include_router(purchase_orders.router)
app.include_router(requirements.router)
app.include_router(stock.router)
app.include_router(transactions.router)

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"token": access_token, "user": {"id": user.id, "username": user.username, "role": user.role}}

@app.get("/")
def read_root():
    return {"message": "Inventory Management API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"} 