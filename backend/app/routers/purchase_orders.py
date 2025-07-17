from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas
from fastapi import Body

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])

@router.post("/", response_model=schemas.PurchaseOrder)
def create_purchase_order(po: schemas.PurchaseOrderCreate, db: Session = Depends(get_db)):
    """Create a new purchase order"""
    return crud.create_purchase_order(db=db, po=po)

@router.get("/", response_model=List[schemas.PurchaseOrder])
def get_purchase_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all purchase orders"""
    return crud.get_purchase_orders(db=db, skip=skip, limit=limit)

@router.get("/{po_id}", response_model=schemas.PurchaseOrder)
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    """Get a specific purchase order"""
    po = crud.get_purchase_order(db=db, po_id=po_id)
    if po is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po

@router.patch("/{po_id}/receive", response_model=schemas.PurchaseOrder)
def receive_purchase_order(po_id: int, data: schemas.PurchaseOrderReceive = Body(...), db: Session = Depends(get_db)):
    """Mark a purchase order as received and update stock, with multiple invoices"""
    po = crud.receive_purchase_order(db=db, po_id=po_id, invoices=data.invoices)
    if po is None:
        raise HTTPException(status_code=404, detail="Purchase order not found or already received")
    return po

# Invoice endpoints
@router.get("/{po_id}/invoices", response_model=List[schemas.Invoice])
def get_purchase_order_invoices(po_id: int, db: Session = Depends(get_db)):
    """Get all invoices for a specific purchase order"""
    return crud.get_invoices_by_po(db=db, po_id=po_id)

@router.post("/{po_id}/invoices", response_model=schemas.Invoice)
def add_invoice_to_purchase_order(po_id: int, invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    """Add an invoice to a purchase order"""
    # Check if PO exists
    po = crud.get_purchase_order(db=db, po_id=po_id)
    if po is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    return crud.create_invoice(db=db, invoice=invoice, po_id=po_id)

@router.put("/invoices/{invoice_id}", response_model=schemas.Invoice)
def update_invoice(invoice_id: int, invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    """Update an invoice"""
    db_invoice = crud.update_invoice(db=db, invoice_id=invoice_id, invoice=invoice)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return db_invoice

@router.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Delete an invoice"""
    db_invoice = crud.delete_invoice(db=db, invoice_id=invoice_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted successfully"} 