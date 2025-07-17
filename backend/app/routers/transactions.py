from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("/", response_model=List[schemas.Transaction])
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all transactions"""
    return crud.get_transactions(db=db, skip=skip, limit=limit)

@router.get("/dashboard", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get dashboard summary data"""
    return crud.get_dashboard_summary(db=db)

@router.get("/to-be-ordered")
def get_to_be_ordered(db: Session = Depends(get_db)):
    """Get items that need to be ordered (exclude already ordered)"""
    # Get all requirement items that need more stock and are not ordered
    from ..models import RequirementItem, Item, Stock, Requirement
    from sqlalchemy import func
    subquery = db.query(
        RequirementItem.item_id,
        func.sum(RequirementItem.quantity_needed - RequirementItem.quantity_issued).label('total_required')
    ).filter(
        RequirementItem.quantity_needed > RequirementItem.quantity_issued,
        RequirementItem.ordered == False  # Only not ordered
    ).group_by(RequirementItem.item_id).subquery()
    
    result = db.query(
        Item,
        subquery.c.total_required,
        func.coalesce(Stock.current_quantity, 0).label('current_stock')
    ).outerjoin(
        subquery, Item.id == subquery.c.item_id
    ).outerjoin(
        Stock, Item.id == Stock.item_id
    ).filter(
        subquery.c.total_required > func.coalesce(Stock.current_quantity, 0)
    ).all()
    
    to_be_ordered = []
    for item, total_required, current_stock in result:
        shortage = total_required - current_stock
        if shortage > 0:
            # Get requirements that need this item and are not ordered
            requirements = db.query(Requirement).join(
                RequirementItem
            ).filter(
                RequirementItem.item_id == item.id,
                RequirementItem.quantity_needed > RequirementItem.quantity_issued,
                RequirementItem.ordered == False
            ).all()
            
            to_be_ordered.append({
                "item": item,
                "total_required": total_required,
                "current_stock": current_stock,
                "shortage": shortage,
                "requirements": requirements
            })
    
    return to_be_ordered 