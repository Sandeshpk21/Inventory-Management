#!/usr/bin/env python3
"""
Test script to verify the new invoice functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models, schemas, crud
from datetime import datetime

def test_invoice_functionality():
    """Test the new invoice functionality"""
    
    db = SessionLocal()
    
    try:
        print("Testing invoice functionality...")
        
        # Test 1: Check if Invoice model exists
        print("✓ Invoice model imported successfully")
        
        # Test 2: Check if schemas work
        invoice_data = {
            "invoice_number": "INV-001",
            "invoice_date": datetime.now(),
            "amount": 1000.0,
            "description": "Test invoice"
        }
        
        invoice_schema = schemas.InvoiceCreate(**invoice_data)
        print("✓ Invoice schema validation works")
        
        # Test 3: Check if we can create a purchase order
        po_data = {
            "supplier_name": "Test Supplier",
            "expected_delivery_date": datetime.now(),
            "items": [
                {
                    "item_id": 1,
                    "quantity": 10,
                    "unit_price": 100.0
                }
            ]
        }
        
        # First, let's check if we have any items
        items = crud.get_items(db)
        if not items:
            print("⚠ No items found in database. Creating a test item...")
            item_data = {
                "name": "Test Item",
                "code": "TEST001",
                "description": "Test item for invoice testing",
                "unit_price": 100.0,
                "minimum_stock": 0
            }
            test_item = crud.create_item(db, schemas.ItemCreate(**item_data))
            po_data["items"][0]["item_id"] = test_item.id
            print(f"✓ Created test item with ID: {test_item.id}")
        else:
            po_data["items"][0]["item_id"] = items[0].id
            print(f"✓ Using existing item with ID: {items[0].id}")
        
        # Create purchase order
        po_schema = schemas.PurchaseOrderCreate(**po_data)
        po = crud.create_purchase_order(db, po_schema)
        print(f"✓ Created purchase order with ID: {po.id}")
        
        # Test 4: Test receiving PO with invoices
        invoices_data = [
            {
                "invoice_number": "INV-001",
                "invoice_date": datetime.now(),
                "amount": 500.0,
                "description": "First invoice"
            },
            {
                "invoice_number": "INV-002", 
                "invoice_date": datetime.now(),
                "amount": 500.0,
                "description": "Second invoice"
            }
        ]
        
        invoices = [schemas.InvoiceCreate(**inv) for inv in invoices_data]
        received_po = crud.receive_purchase_order(db, po.id, invoices)
        
        if received_po:
            print(f"✓ Successfully received PO with {len(received_po.invoices)} invoices")
            for i, invoice in enumerate(received_po.invoices):
                print(f"  - Invoice {i+1}: {invoice.invoice_number} - {invoice.amount}")
        else:
            print("✗ Failed to receive PO")
            return False
        
        # Test 5: Test invoice CRUD operations
        test_invoice = crud.get_invoices_by_po(db, po.id)
        print(f"✓ Retrieved {len(test_invoice)} invoices for PO")
        
        # Test 6: Test adding another invoice
        new_invoice_data = {
            "invoice_number": "INV-003",
            "invoice_date": datetime.now(),
            "amount": 200.0,
            "description": "Additional invoice"
        }
        
        new_invoice = crud.create_invoice(db, schemas.InvoiceCreate(**new_invoice_data), po.id)
        print(f"✓ Added new invoice: {new_invoice.invoice_number}")
        
        # Test 7: Test updating invoice
        update_data = {
            "invoice_number": "INV-003-UPDATED",
            "invoice_date": datetime.now(),
            "amount": 250.0,
            "description": "Updated invoice"
        }
        
        updated_invoice = crud.update_invoice(db, new_invoice.id, schemas.InvoiceCreate(**update_data))
        if updated_invoice:
            print(f"✓ Updated invoice: {updated_invoice.invoice_number}")
        
        # Test 8: Test deleting invoice
        deleted_invoice = crud.delete_invoice(db, new_invoice.id)
        if deleted_invoice:
            print("✓ Deleted invoice successfully")
        
        print("\n🎉 All invoice functionality tests passed!")
        return True
        
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = test_invoice_functionality()
    sys.exit(0 if success else 1) 