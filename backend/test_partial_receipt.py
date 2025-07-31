#!/usr/bin/env python3
"""
Test script to verify that the partial receipt functionality is working correctly.
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_create_po_with_items():
    """Test creating a purchase order with multiple items"""
    
    po_data = {
        "supplier_name": "Test Supplier",
        "expected_delivery_date": (datetime.now() + timedelta(days=7)).isoformat(),
        "items": [
            {
                "item_id": 1,
                "quantity": 10,
                "unit_price": 100.0
            },
            {
                "item_id": 2,
                "quantity": 5,
                "unit_price": 200.0
            }
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/purchase-orders/", json=po_data)
        
        if response.status_code == 200:
            print("✓ Successfully created purchase order")
            created_po = response.json()
            print(f"  - PO Number: {created_po['po_number']}")
            print(f"  - Status: {created_po['status']}")
            print(f"  - Items: {len(created_po['items'])}")
            return created_po
        else:
            print(f"✗ Failed to create PO: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to server. Make sure the backend is running.")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_partial_receipt(po_id):
    """Test partial receipt of a purchase order"""
    
    partial_receipt_data = {
        "items": [
            {
                "item_id": 1,
                "quantity": 3  # Receive 3 out of 10
            },
            {
                "item_id": 2,
                "quantity": 2  # Receive 2 out of 5
            }
        ],
        "invoices": [
            {
                "invoice_number": "INV-001",
                "invoice_date": datetime.now().isoformat(),
                "amount": 700.0,
                "description": "Partial delivery"
            }
        ]
    }
    
    try:
        response = requests.patch(f"{BASE_URL}/purchase-orders/{po_id}/receive-partial", json=partial_receipt_data)
        
        if response.status_code == 200:
            print("✓ Successfully received partial PO")
            updated_po = response.json()
            print(f"  - Status: {updated_po['status']}")
            print(f"  - Items received:")
            for item in updated_po['items']:
                print(f"    - {item['item']['name']}: {item['received_quantity']}/{item['quantity']}")
            return updated_po
        else:
            print(f"✗ Failed to receive partial PO: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to server. Make sure the backend is running.")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_complete_receipt(po_id):
    """Test completing the remaining items"""
    
    complete_receipt_data = {
        "items": [
            {
                "item_id": 1,
                "quantity": 7  # Receive remaining 7
            },
            {
                "item_id": 2,
                "quantity": 3  # Receive remaining 3
            }
        ],
        "invoices": [
            {
                "invoice_number": "INV-002",
                "invoice_date": datetime.now().isoformat(),
                "amount": 1300.0,
                "description": "Final delivery"
            }
        ]
    }
    
    try:
        response = requests.patch(f"{BASE_URL}/purchase-orders/{po_id}/receive-partial", json=complete_receipt_data)
        
        if response.status_code == 200:
            print("✓ Successfully completed PO receipt")
            updated_po = response.json()
            print(f"  - Status: {updated_po['status']}")
            print(f"  - Final items status:")
            for item in updated_po['items']:
                print(f"    - {item['item']['name']}: {item['received_quantity']}/{item['quantity']}")
            return updated_po
        else:
            print(f"✗ Failed to complete PO: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to server. Make sure the backend is running.")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def main():
    print("Testing partial receipt functionality...")
    print("=" * 60)
    
    # Test 1: Create PO
    print("\n1. Creating purchase order...")
    po = test_create_po_with_items()
    if not po:
        print("✗ Cannot proceed without creating PO")
        return
    
    po_id = po['id']
    
    # Test 2: Partial receipt
    print("\n2. Testing partial receipt...")
    partial_po = test_partial_receipt(po_id)
    if not partial_po:
        print("✗ Partial receipt failed")
        return
    
    # Test 3: Complete receipt
    print("\n3. Testing complete receipt...")
    complete_po = test_complete_receipt(po_id)
    if not complete_po:
        print("✗ Complete receipt failed")
        return
    
    print("\n" + "=" * 60)
    print("✓ All tests passed! Partial receipt functionality is working correctly.")

if __name__ == "__main__":
    main() 