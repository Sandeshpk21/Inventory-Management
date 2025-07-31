from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import uuid
import pytz
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())

def generate_po_number():
    import random
    import string
    short_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"PO-{short_id}"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin' or 'employee'
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    make = Column(String, nullable=True)
    model_number = Column(String, nullable=True)
    unit_price = Column(Float, default=0.0)
    minimum_stock = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    
    # Relationships
    stock = relationship("Stock", back_populates="item", uselist=False)
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="item")
    requirement_items = relationship("RequirementItem", back_populates="item")
    transactions = relationship("Transaction", back_populates="item")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True, default=generate_po_number)
    supplier_name = Column(String)
    expected_delivery_date = Column(DateTime)
    status = Column(String, default="Pending")  # Pending, Partially Received, Received, Cancelled
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    received_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="purchase_order", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="purchase_order")

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    invoice_number = Column(String, index=True)
    invoice_date = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    amount = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="invoices")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    quantity = Column(Integer)  # Total ordered quantity
    received_quantity = Column(Integer, default=0)  # Quantity received so far
    unit_price = Column(Float)
    total_price = Column(Float)
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    item = relationship("Item", back_populates="purchase_order_items")

class Requirement(Base):
    __tablename__ = "requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String)
    description = Column(Text, nullable=True)
    status = Column(String, default="Active")  # Active, Completed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    items = relationship("RequirementItem", back_populates="requirement", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="requirement")

class RequirementItem(Base):
    __tablename__ = "requirement_items"
    
    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    quantity_needed = Column(Integer)
    quantity_issued = Column(Integer, default=0)
    ordered = Column(Boolean, default=False)
    
    # Relationships
    requirement = relationship("Requirement", back_populates="items")
    item = relationship("Item", back_populates="requirement_items")

class Stock(Base):
    __tablename__ = "stock"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), unique=True)
    current_quantity = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')), onupdate=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    
    # Relationships
    item = relationship("Item", back_populates="stock")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    quantity = Column(Integer)
    action = Column(String)  # Purchase, Issue, Return
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    
    # Relationships
    item = relationship("Item", back_populates="transactions")
    purchase_order = relationship("PurchaseOrder", back_populates="transactions")
    requirement = relationship("Requirement", back_populates="transactions") 