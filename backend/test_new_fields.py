#!/usr/bin/env python3
"""
Test script to verify that the new make and model_number fields are working correctly.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_create_item_with_make_model():
    """Test creating an item with make and model_number fields"""
    
    item_data = {
        "name": "Test Circuit Breaker",
        "code": "TESTCB001",
        "description": "Test circuit breaker for testing",
        "make": "Test Manufacturer",
        "model_number": "TEST-MODEL-001",
        "unit_price": 150.00,
        "minimum_stock": 5
    }
    
    try:
        response = requests.post(f"{BASE_URL}/stock/items", json=item_data)
        
        if response.status_code == 200:
            print("✓ Successfully created item with make and model_number")
            created_item = response.json()
            print(f"  - Name: {created_item['name']}")
            print(f"  - Make: {created_item['make']}")
            print(f"  - Model: {created_item['model_number']}")
            return True
        else:
            print(f"✗ Failed to create item: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to server. Make sure the backend is running.")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_get_items():
    """Test getting items to verify the new fields are returned"""
    
    try:
        response = requests.get(f"{BASE_URL}/stock/items")
        
        if response.status_code == 200:
            items = response.json()
            print(f"✓ Successfully retrieved {len(items)} items")
            
            # Check if any items have make/model fields
            items_with_make = [item for item in items if item.get('make')]
            items_with_model = [item for item in items if item.get('model_number')]
            
            print(f"  - Items with make: {len(items_with_make)}")
            print(f"  - Items with model_number: {len(items_with_model)}")
            
            if items_with_make:
                print("  Sample item with make:")
                sample = items_with_make[0]
                print(f"    - Name: {sample['name']}")
                print(f"    - Make: {sample['make']}")
                print(f"    - Model: {sample.get('model_number', 'N/A')}")
            
            return True
        else:
            print(f"✗ Failed to get items: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to server. Make sure the backend is running.")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def main():
    print("Testing new make and model_number fields...")
    print("=" * 50)
    
    # Test 1: Create item with new fields
    print("\n1. Testing item creation with make and model_number...")
    create_success = test_create_item_with_make_model()
    
    # Test 2: Get items to verify fields are returned
    print("\n2. Testing item retrieval...")
    get_success = test_get_items()
    
    print("\n" + "=" * 50)
    if create_success and get_success:
        print("✓ All tests passed! The new fields are working correctly.")
    else:
        print("✗ Some tests failed. Please check the implementation.")

if __name__ == "__main__":
    main() 