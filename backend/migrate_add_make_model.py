#!/usr/bin/env python3
"""
Migration script to add make and model_number columns to the items table.
Run this script to update existing databases with the new columns.
"""

import sqlite3
import os
from pathlib import Path

def migrate_database():
    """Add make and model_number columns to the items table"""
    
    # Get the database path
    db_path = Path(__file__).parent / "inventory.db"
    
    if not db_path.exists():
        print(f"Database file not found at {db_path}")
        return
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(items)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'make' not in columns:
            print("Adding 'make' column to items table...")
            cursor.execute("ALTER TABLE items ADD COLUMN make TEXT")
            print("✓ 'make' column added successfully")
        else:
            print("✓ 'make' column already exists")
        
        if 'model_number' not in columns:
            print("Adding 'model_number' column to items table...")
            cursor.execute("ALTER TABLE items ADD COLUMN model_number TEXT")
            print("✓ 'model_number' column added successfully")
        else:
            print("✓ 'model_number' column already exists")
        
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