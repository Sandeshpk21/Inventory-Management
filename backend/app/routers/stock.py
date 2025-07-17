from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
import csv
from ..database import get_db
from .. import crud, schemas, models
from ..dependencies import require_role
# Will use get_current_user for endpoint protection later

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

@router.get("/export-csv")
def export_items_to_csv(db: Session = Depends(get_db)):
    """Export items to CSV format"""
    try:
        items = crud.get_items(db=db)
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['name', 'code', 'description', 'unit_price', 'minimum_stock', 'current_quantity'])
        
        # Write data
        for item in items:
            stock = crud.get_stock_by_item(db=db, item_id=item.id)
            current_quantity = stock.current_quantity if stock else 0
            
            writer.writerow([
                item.name,
                item.code,
                item.description or '',
                item.unit_price,
                item.minimum_stock,
                current_quantity
            ])
        
        output.seek(0)
        return {
            'csv_content': output.getvalue(),
            'filename': 'inventory_items.csv'
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting CSV: {str(e)}")

@router.post("/import-csv")
async def import_items_from_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import items from CSV file"""
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")
    
    try:
        # Read CSV content
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(content_str))
        
        # Expected columns
        required_columns = ['name', 'code']
        optional_columns = ['description', 'unit_price', 'minimum_stock', 'current_quantity']
        
        # Validate headers
        if not all(col in csv_reader.fieldnames for col in required_columns):
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain required columns: {', '.join(required_columns)}"
            )
        
        results = {
            'successful': 0,
            'failed': 0,
            'errors': []
        }
        
        # Process each row
        for row_num, row in enumerate(csv_reader, start=2):  # Start from 2 because row 1 is header
            try:
                # Prepare item data
                item_data = {
                    'name': row['name'].strip(),
                    'code': row['code'].strip(),
                    'description': row.get('description', '').strip() or None,
                    'unit_price': float(row.get('unit_price', 0)) if row.get('unit_price') else 0.0,
                    'minimum_stock': int(row.get('minimum_stock', 0)) if row.get('minimum_stock') else 0
                }
                
                # Validate required fields
                if not item_data['name'] or not item_data['code']:
                    results['errors'].append(f"Row {row_num}: Name and code are required")
                    results['failed'] += 1
                    continue
                
                # Check if item code already exists
                existing_item = crud.get_item_by_code(db=db, code=item_data['code'])
                if existing_item:
                    results['errors'].append(f"Row {row_num}: Item code '{item_data['code']}' already exists")
                    results['failed'] += 1
                    continue
                
                # Create item
                item_schema = schemas.ItemCreate(**item_data)
                new_item = crud.create_item(db=db, item=item_schema)
                
                # Update stock if current_quantity is provided
                if row.get('current_quantity'):
                    try:
                        quantity = int(row['current_quantity'])
                        if quantity > 0:
                            crud.update_stock(db=db, item_id=new_item.id, quantity=quantity)
                    except ValueError:
                        results['errors'].append(f"Row {row_num}: Invalid current_quantity value")
                
                results['successful'] += 1
                
            except Exception as e:
                results['errors'].append(f"Row {row_num}: {str(e)}")
                results['failed'] += 1
        
        return {
            'message': f"Import completed. {results['successful']} items imported successfully, {results['failed']} failed.",
            'results': results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV file: {str(e)}")

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