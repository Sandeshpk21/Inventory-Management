from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas
from ..models import RequirementItem, Stock, Transaction
from ..models import Requirement
from fastapi import Depends
from ..dependencies import require_role

router = APIRouter(prefix="/requirements", tags=["requirements"])

@router.post("/", response_model=schemas.Requirement)
def create_requirement(requirement: schemas.RequirementCreate, db: Session = Depends(get_db)):
    """Create a new requirement/project"""
    return crud.create_requirement(db=db, requirement=requirement)

@router.get("/", response_model=List[schemas.Requirement])
def get_requirements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all requirements/projects"""
    return crud.get_requirements(db=db, skip=skip, limit=limit)

@router.get("/{requirement_id}", response_model=schemas.Requirement)
def get_requirement(requirement_id: int, db: Session = Depends(get_db)):
    """Get a specific requirement/project"""
    requirement = crud.get_requirement(db=db, requirement_id=requirement_id)
    if requirement is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return requirement

@router.patch("/{requirement_id}/issue", response_model=schemas.Requirement)
def issue_items_for_requirement(requirement_id: int, db: Session = Depends(get_db)):
    """Issue items for a requirement and update stock"""
    requirement = crud.issue_items_for_requirement(db=db, requirement_id=requirement_id)
    if requirement is None:
        raise HTTPException(status_code=404, detail="Requirement not found, already completed, or insufficient stock")
    return requirement

@router.patch("/{requirement_id}/items/{item_id}/issue", response_model=schemas.Requirement)
def issue_item_for_requirement(requirement_id: int, item_id: int, db: Session = Depends(get_db)):
    """Issue a specific item for a requirement and update stock"""
    req_item = db.query(RequirementItem).filter(
        RequirementItem.requirement_id == requirement_id,
        RequirementItem.item_id == item_id
    ).first()
    if not req_item or req_item.quantity_issued >= req_item.quantity_needed:
        raise HTTPException(status_code=400, detail="Item already fully issued or not found")
    # Check stock
    stock = db.query(Stock).filter(Stock.item_id == item_id).first()
    quantity_to_issue = req_item.quantity_needed - req_item.quantity_issued
    if not stock or stock.current_quantity < quantity_to_issue:
        raise HTTPException(status_code=400, detail="Not enough stock to issue this item")
    # Issue item
    stock.current_quantity -= quantity_to_issue
    req_item.quantity_issued += quantity_to_issue
    # Create transaction
    transaction = Transaction(
        item_id=item_id,
        quantity=quantity_to_issue,
        action="Issue",
        requirement_id=requirement_id
    )
    db.add(transaction)
    db.commit()
    # Optionally, mark as completed if all items are issued
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    all_issued = all(i.quantity_issued >= i.quantity_needed for i in requirement.items)
    if all_issued:
        requirement.status = "Completed"
    db.commit()
    db.refresh(requirement)
    return requirement

@router.patch("/{requirement_id}", response_model=schemas.Requirement)
def update_requirement(requirement_id: int, requirement_update: schemas.RequirementUpdate, db: Session = Depends(get_db)):
    """Update requirement status"""
    requirement = crud.get_requirement(db=db, requirement_id=requirement_id)
    if requirement is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    requirement.status = requirement_update.status
    if requirement_update.status == "Completed":
        from datetime import datetime
        requirement.completed_at = datetime.now()
    
    db.commit()
    db.refresh(requirement)
    return requirement 