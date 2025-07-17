from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# Item CRUD operations
def get_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Item).offset(skip).limit(limit).all()

def get_item(db: Session, item_id: int):
    return db.query(models.Item).filter(models.Item.id == item_id).first()

def get_item_by_code(db: Session, code: str):
    return db.query(models.Item).filter(models.Item.code == code).first()

def create_item(db: Session, item: schemas.ItemCreate):
    db_item = models.Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Create stock entry for new item
    db_stock = models.Stock(item_id=db_item.id, current_quantity=0)
    db.add(db_stock)
    db.commit()
    
    return db_item

def update_item(db: Session, item_id: int, item: schemas.ItemCreate):
    db_item = get_item(db, item_id)
    if db_item:
        for key, value in item.dict().items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
    return db_item

# Purchase Order CRUD operations
def get_purchase_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.PurchaseOrder).offset(skip).limit(limit).all()

def get_purchase_order(db: Session, po_id: int):
    return db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()

def create_purchase_order(db: Session, po: schemas.PurchaseOrderCreate):
    # Calculate total amount
    total_amount = sum(item.quantity * item.unit_price for item in po.items)
    
    db_po = models.PurchaseOrder(
        supplier_name=po.supplier_name,
        expected_delivery_date=po.expected_delivery_date,
        total_amount=total_amount
    )
    db.add(db_po)
    db.commit()
    db.refresh(db_po)
    
    # Create PO items
    for item in po.items:
        db_po_item = models.PurchaseOrderItem(
            purchase_order_id=db_po.id,
            item_id=item.item_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.quantity * item.unit_price
        )
        db.add(db_po_item)
        # Mark related requirement items as ordered
        req_items = db.query(models.RequirementItem).filter(
            models.RequirementItem.item_id == item.item_id,
            models.RequirementItem.ordered == False,
            models.RequirementItem.quantity_issued < models.RequirementItem.quantity_needed
        ).all()
        for req_item in req_items:
            req_item.ordered = True
    
    db.commit()
    db.refresh(db_po)
    return db_po

def receive_purchase_order(db: Session, po_id: int, invoices: List[schemas.InvoiceCreate] = None):
    db_po = get_purchase_order(db, po_id)
    if not db_po or db_po.status == "Received":
        return None
    
    db_po.status = "Received"
    db_po.received_at = datetime.now()
    
    # Create invoices if provided
    if invoices:
        for invoice_data in invoices:
            db_invoice = models.Invoice(
                purchase_order_id=po_id,
                invoice_number=invoice_data.invoice_number,
                invoice_date=invoice_data.invoice_date,
                amount=invoice_data.amount,
                description=invoice_data.description
            )
            db.add(db_invoice)
    
    # Add items to stock and create transactions
    for po_item in db_po.items:
        # Update stock
        stock = db.query(models.Stock).filter(models.Stock.item_id == po_item.item_id).first()
        if stock:
            stock.current_quantity += po_item.quantity
        else:
            stock = models.Stock(item_id=po_item.item_id, current_quantity=po_item.quantity)
            db.add(stock)
        
        # Create transaction
        transaction = models.Transaction(
            item_id=po_item.item_id,
            quantity=po_item.quantity,
            action="Purchase",
            purchase_order_id=po_id
        )
        db.add(transaction)
    
    db.commit()
    db.refresh(db_po)
    return db_po

# Requirement CRUD operations
def get_requirements(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Requirement).offset(skip).limit(limit).all()

def get_requirement(db: Session, requirement_id: int):
    return db.query(models.Requirement).filter(models.Requirement.id == requirement_id).first()

def create_requirement(db: Session, requirement: schemas.RequirementCreate):
    db_requirement = models.Requirement(
        project_name=requirement.project_name,
        description=requirement.description
    )
    db.add(db_requirement)
    db.commit()
    db.refresh(db_requirement)
    
    # Create requirement items
    for item in requirement.items:
        db_req_item = models.RequirementItem(
            requirement_id=db_requirement.id,
            item_id=item.item_id,
            quantity_needed=item.quantity_needed
        )
        db.add(db_req_item)
    
    db.commit()
    db.refresh(db_requirement)
    return db_requirement

def issue_items_for_requirement(db: Session, requirement_id: int):
    db_requirement = get_requirement(db, requirement_id)
    if not db_requirement or db_requirement.status == "Completed":
        return None
    
    # Check if all items can be issued
    for req_item in db_requirement.items:
        stock = db.query(models.Stock).filter(models.Stock.item_id == req_item.item_id).first()
        if not stock or stock.current_quantity < (req_item.quantity_needed - req_item.quantity_issued):
            return None  # Not enough stock
    
    # Issue items
    for req_item in db_requirement.items:
        stock = db.query(models.Stock).filter(models.Stock.item_id == req_item.item_id).first()
        quantity_to_issue = req_item.quantity_needed - req_item.quantity_issued
        
        if quantity_to_issue > 0:
            stock.current_quantity -= quantity_to_issue
            req_item.quantity_issued += quantity_to_issue
            
            # Create transaction
            transaction = models.Transaction(
                item_id=req_item.item_id,
                quantity=quantity_to_issue,
                action="Issue",
                requirement_id=requirement_id
            )
            db.add(transaction)
    
    # Check if requirement is complete
    all_issued = all(req_item.quantity_issued >= req_item.quantity_needed for req_item in db_requirement.items)
    if all_issued:
        db_requirement.status = "Completed"
        db_requirement.completed_at = datetime.now()
    
    db.commit()
    db.refresh(db_requirement)
    return db_requirement

# Stock CRUD operations
def get_stock(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Stock).offset(skip).limit(limit).all()

def get_stock_by_item(db: Session, item_id: int):
    return db.query(models.Stock).filter(models.Stock.item_id == item_id).first()

def update_stock(db: Session, item_id: int, quantity: int):
    stock = get_stock_by_item(db, item_id)
    if stock:
        stock.current_quantity = quantity
        db.commit()
        db.refresh(stock)
    return stock

# Invoice CRUD operations
def get_invoices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Invoice).offset(skip).limit(limit).all()

def get_invoice(db: Session, invoice_id: int):
    return db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()

def get_invoices_by_po(db: Session, po_id: int):
    return db.query(models.Invoice).filter(models.Invoice.purchase_order_id == po_id).all()

def create_invoice(db: Session, invoice: schemas.InvoiceCreate, po_id: int):
    db_invoice = models.Invoice(
        purchase_order_id=po_id,
        **invoice.dict()
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def update_invoice(db: Session, invoice_id: int, invoice: schemas.InvoiceCreate):
    db_invoice = get_invoice(db, invoice_id)
    if db_invoice:
        for key, value in invoice.dict().items():
            setattr(db_invoice, key, value)
        db.commit()
        db.refresh(db_invoice)
    return db_invoice

def delete_invoice(db: Session, invoice_id: int):
    db_invoice = get_invoice(db, invoice_id)
    if db_invoice:
        db.delete(db_invoice)
        db.commit()
    return db_invoice

# Transaction CRUD operations
def get_transactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Transaction).options(
        joinedload(models.Transaction.item),
        joinedload(models.Transaction.purchase_order),
        joinedload(models.Transaction.requirement)
    ).order_by(models.Transaction.created_at.desc()).offset(skip).limit(limit).all()

def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_transaction = models.Transaction(**transaction.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

# To-Be-Ordered operations
def get_to_be_ordered(db: Session):
    # Get all requirement items that need more stock
    subquery = db.query(
        models.RequirementItem.item_id,
        func.sum(models.RequirementItem.quantity_needed - models.RequirementItem.quantity_issued).label('total_required')
    ).filter(
        models.RequirementItem.quantity_needed > models.RequirementItem.quantity_issued
    ).group_by(models.RequirementItem.item_id).subquery()
    
    # Join with items and stock
    result = db.query(
        models.Item,
        subquery.c.total_required,
        func.coalesce(models.Stock.current_quantity, 0).label('current_stock')
    ).outerjoin(
        subquery, models.Item.id == subquery.c.item_id
    ).outerjoin(
        models.Stock, models.Item.id == models.Stock.item_id
    ).filter(
        subquery.c.total_required > func.coalesce(models.Stock.current_quantity, 0)
    ).all()
    
    to_be_ordered = []
    for item, total_required, current_stock in result:
        shortage = total_required - current_stock
        if shortage > 0:
            # Get requirements that need this item
            requirements = db.query(models.Requirement).join(
                models.RequirementItem
            ).filter(
                models.RequirementItem.item_id == item.id,
                models.RequirementItem.quantity_needed > models.RequirementItem.quantity_issued
            ).all()
            
            to_be_ordered.append({
                "item": item,
                "total_required": total_required,
                "current_stock": current_stock,
                "shortage": shortage,
                "requirements": requirements
            })
    
    return to_be_ordered

# Dashboard operations
def get_dashboard_summary(db: Session):
    total_stock_items = db.query(models.Stock).count()
    items_to_be_ordered = len(get_to_be_ordered(db))
    active_projects = db.query(models.Requirement).filter(models.Requirement.status == "Active").count()
    total_purchase_orders = db.query(models.PurchaseOrder).count()
    recent_transactions = get_transactions(db, limit=5)
    recent_purchase_orders = db.query(models.PurchaseOrder).order_by(models.PurchaseOrder.created_at.desc()).limit(5).all()
    
    return {
        "total_stock_items": total_stock_items,
        "items_to_be_ordered": items_to_be_ordered,
        "active_projects": active_projects,
        "total_purchase_orders": total_purchase_orders,
        "recent_transactions": recent_transactions,
        "recent_purchase_orders": recent_purchase_orders
    } 