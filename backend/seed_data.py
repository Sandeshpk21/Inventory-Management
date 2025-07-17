#!/usr/bin/env python3
"""
Seed script to populate the database with sample data for testing.
Run this after starting the backend server for the first time.
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def create_sample_data():
    """Create sample data for testing the inventory system."""
    
    print("🌱 Seeding database with sample data...")
    
    # Sample items
    items = [
        {
            "name": "Circuit Breaker 32A",
            "code": "CB-32A",
            "description": "32A circuit breaker for electrical panels",
            "unit_price": 25.50,
            "minimum_stock": 10
        },
        {
            "name": "MCB 16A",
            "code": "MCB-16A", 
            "description": "16A miniature circuit breaker",
            "unit_price": 15.75,
            "minimum_stock": 20
        },
        {
            "name": "Contact Relay 24V",
            "code": "CR-24V",
            "description": "24V contact relay for automation",
            "unit_price": 45.00,
            "minimum_stock": 5
        },
        {
            "name": "PLC Module",
            "code": "PLC-MOD",
            "description": "Programmable Logic Controller module",
            "unit_price": 250.00,
            "minimum_stock": 3
        },
        {
            "name": "Control Panel Enclosure",
            "code": "CPE-600",
            "description": "600x400mm control panel enclosure",
            "unit_price": 180.00,
            "minimum_stock": 2
        }
    ]
    
    # Create items
    created_items = []
    for item in items:
        try:
            response = requests.post(f"{BASE_URL}/stock/items", json=item)
            if response.status_code == 200:
                created_item = response.json()
                created_items.append(created_item)
                print(f"✅ Created item: {created_item['name']}")
            else:
                print(f"❌ Failed to create item: {item['name']}")
        except Exception as e:
            print(f"❌ Error creating item {item['name']}: {e}")
    
    # Update stock levels
    stock_levels = [50, 100, 15, 8, 5]  # Corresponding to items above
    
    for i, item in enumerate(created_items):
        try:
            response = requests.patch(f"{BASE_URL}/stock/{item['id']}", 
                                   json={"current_quantity": stock_levels[i]})
            if response.status_code == 200:
                print(f"✅ Updated stock for {item['name']}: {stock_levels[i]} units")
            else:
                print(f"❌ Failed to update stock for {item['name']}")
        except Exception as e:
            print(f"❌ Error updating stock for {item['name']}: {e}")
    
    # Create sample purchase orders
    purchase_orders = [
        {
            "supplier_name": "ElectroSupply Co.",
            "expected_delivery_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "items": [
                {"item_id": created_items[0]['id'], "quantity": 20, "unit_price": 24.00},
                {"item_id": created_items[1]['id'], "quantity": 50, "unit_price": 14.50}
            ]
        },
        {
            "supplier_name": "Automation Parts Ltd.",
            "expected_delivery_date": (datetime.now() + timedelta(days=14)).isoformat(),
            "items": [
                {"item_id": created_items[2]['id'], "quantity": 10, "unit_price": 42.00},
                {"item_id": created_items[3]['id'], "quantity": 2, "unit_price": 240.00}
            ]
        }
    ]
    
    for po in purchase_orders:
        try:
            response = requests.post(f"{BASE_URL}/purchase-orders/", json=po)
            if response.status_code == 200:
                created_po = response.json()
                print(f"✅ Created PO: {created_po['po_number']} from {po['supplier_name']}")
            else:
                print(f"❌ Failed to create PO from {po['supplier_name']}")
        except Exception as e:
            print(f"❌ Error creating PO: {e}")
    
    # Create sample requirements
    requirements = [
        {
            "project_name": "Factory Automation Panel",
            "description": "Main control panel for factory automation system",
            "items": [
                {"item_id": created_items[0]['id'], "quantity_needed": 8},
                {"item_id": created_items[2]['id'], "quantity_needed": 4},
                {"item_id": created_items[3]['id'], "quantity_needed": 1}
            ]
        },
        {
            "project_name": "HVAC Control System",
            "description": "Heating, ventilation, and air conditioning control panel",
            "items": [
                {"item_id": created_items[1]['id'], "quantity_needed": 12},
                {"item_id": created_items[2]['id'], "quantity_needed": 6},
                {"item_id": created_items[4]['id'], "quantity_needed": 1}
            ]
        }
    ]
    
    for req in requirements:
        try:
            response = requests.post(f"{BASE_URL}/requirements/", json=req)
            if response.status_code == 200:
                created_req = response.json()
                print(f"✅ Created requirement: {created_req['project_name']}")
            else:
                print(f"❌ Failed to create requirement: {req['project_name']}")
        except Exception as e:
            print(f"❌ Error creating requirement: {e}")
    
    print("\n🎉 Sample data creation completed!")
    print("\n📊 You can now:")
    print("   - View the dashboard at http://localhost:5173")
    print("   - Check stock levels in the Stock page")
    print("   - View purchase orders in the Purchase Orders page")
    print("   - See requirements in the Requirements page")
    print("   - Monitor to-be-ordered items")
    print("   - View transaction history")

if __name__ == "__main__":
    try:
        create_sample_data()
    except KeyboardInterrupt:
        print("\n⏹️  Seeding interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        print("Make sure the backend server is running at http://localhost:8000") 