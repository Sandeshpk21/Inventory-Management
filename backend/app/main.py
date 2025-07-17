from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import purchase_orders, requirements, stock, transactions

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory Management System",
    description="Complete inventory management system for electric control panel manufacturing",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://10.179.21.162:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(purchase_orders.router)
app.include_router(requirements.router)
app.include_router(stock.router)
app.include_router(transactions.router)

@app.get("/")
def read_root():
    return {
        "message": "Inventory Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"} 