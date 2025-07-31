#!/usr/bin/env python3
"""
Migration script to add received_quantity column to the purchase_order_items table.
Run this script to update existing databases with the new column.
"""

import sqlite3
import os
from pathlib import Path

def migrate_database():
    """Add received_quantity column to the purchase_order_items table"""
    
    # Get the database path
    db_path = Path(__file__).parent / "inventory.db"
    
    if not db_path.exists():
        print(f"Database file not found at {db_path}")
        return
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(purchase_order_items)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'received_quantity' not in columns:
            print("Adding 'received_quantity' column to purchase_order_items table...")
            cursor.execute("ALTER TABLE purchase_order_items ADD COLUMN received_quantity INTEGER DEFAULT 0")
            print("✓ 'received_quantity' column added successfully")
        else:
            print("✓ 'received_quantity' column already exists")
        
        # Commit changes
        conn.commit()
        print("\nMigration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Starting database migration...")
    migrate_database()
    print("Migration script finished.") 