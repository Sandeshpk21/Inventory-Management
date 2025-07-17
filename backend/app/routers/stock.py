from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas, models

router = APIRouter(prefix="/stock", tags=["stock"])

@router.post("/items", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    """Create a new item"""
    db_item = crud.get_item_by_code(db=db, code=item.code)
    if db_item:
        raise HTTPException(status_code=400, detail="Item code already exists")
    return crud.create_item(db=db, item=item)

@router.get("/items", response_model=List[schemas.Item])
def get_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all items with their stock"""
    items = db.query(models.Item).offset(skip).limit(limit).all()
    # The .stock relationship will be included if configured in the SQLAlchemy model
    return items

@router.get("/items/{item_id}", response_model=schemas.Item)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get a specific item"""
    item = crud.get_item(db=db, item_id=item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/items/{item_id}", response_model=schemas.Item)
def update_item(item_id: int, item: schemas.ItemCreate, db: Session = Depends(get_db)):
    """Update an item"""
    db_item = crud.update_item(db=db, item_id=item_id, item=item)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.get("/", response_model=List[schemas.StockStandalone])
def get_stock(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all stock levels"""
    return crud.get_stock(db=db, skip=skip, limit=limit)

@router.get("/{item_id}", response_model=schemas.StockStandalone)
def get_stock_by_item(item_id: int, db: Session = Depends(get_db)):
    """Get stock level for a specific item"""
    stock = crud.get_stock_by_item(db=db, item_id=item_id)
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found for this item")
    return stock

@router.patch("/{item_id}", response_model=schemas.StockStandalone)
def update_stock(item_id: int, stock_update: schemas.StockUpdate, db: Session = Depends(get_db)):
    """Update stock level for an item"""
    stock = crud.update_stock(db=db, item_id=item_id, quantity=stock_update.current_quantity)
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found for this item")
    return stock 