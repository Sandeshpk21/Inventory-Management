from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Stock Schema (for embedding in Item)
class Stock(BaseModel):
    id: int
    item_id: int
    current_quantity: int
    last_updated: datetime
    class Config:
        from_attributes = True

# Item Schemas
class ItemBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    unit_price: float = 0.0
    minimum_stock: int = 0

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    created_at: datetime
    stock: Optional[Stock] = None  # <-- Add stock field
    
    class Config:
        from_attributes = True

# Invoice Schemas
class InvoiceBase(BaseModel):
    invoice_number: str
    invoice_date: datetime
    amount: float
    description: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class Invoice(InvoiceBase):
    id: int
    purchase_order_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Purchase Order Item Schemas
class PurchaseOrderItemBase(BaseModel):
    item_id: int
    quantity: int
    unit_price: float

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItem(PurchaseOrderItemBase):
    id: int
    total_price: float
    item: Item
    
    class Config:
        from_attributes = True

# Purchase Order Schemas
class PurchaseOrderBase(BaseModel):
    supplier_name: str
    expected_delivery_date: datetime

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    status: str

class PurchaseOrderReceive(BaseModel):
    invoices: List[InvoiceCreate]

class PurchaseOrder(PurchaseOrderBase):
    id: int
    po_number: str
    status: str
    total_amount: float
    created_at: datetime
    received_at: Optional[datetime] = None
    items: List[PurchaseOrderItem] = []
    invoices: List[Invoice] = []
    
    class Config:
        from_attributes = True

# Requirement Item Schemas
class RequirementItemBase(BaseModel):
    item_id: int
    quantity_needed: int

class RequirementItemCreate(RequirementItemBase):
    pass

class RequirementItem(RequirementItemBase):
    id: int
    quantity_issued: int
    ordered: bool  # <-- Add this field
    item: Item
    
    class Config:
        from_attributes = True

# Requirement Schemas
class RequirementBase(BaseModel):
    project_name: str
    description: Optional[str] = None

class RequirementCreate(RequirementBase):
    items: List[RequirementItemCreate]

class RequirementUpdate(BaseModel):
    status: str

class Requirement(RequirementBase):
    id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    items: List[RequirementItem] = []
    
    class Config:
        from_attributes = True

# Stock Schemas (standalone)
class StockBase(BaseModel):
    item_id: int
    current_quantity: int

class StockCreate(StockBase):
    pass

class StockUpdate(BaseModel):
    current_quantity: int

class StockStandalone(StockBase):
    id: int
    last_updated: datetime
    item: Item
    
    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionBase(BaseModel):
    item_id: int
    quantity: int
    action: str
    purchase_order_id: Optional[int] = None
    requirement_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    created_at: datetime
    item: Item
    
    class Config:
        from_attributes = True

# To-Be-Ordered Schema
class ToBeOrderedItem(BaseModel):
    item: Item
    total_required: int
    current_stock: int
    shortage: int
    requirements: List[Requirement] = []
    
    class Config:
        from_attributes = True

# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    total_stock_items: int
    items_to_be_ordered: int
    active_projects: int
    total_purchase_orders: int
    recent_transactions: List[Transaction] = []
    recent_purchase_orders: List[PurchaseOrder] = []
    
    class Config:
        from_attributes = True

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 