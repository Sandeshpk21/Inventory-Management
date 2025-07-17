import sqlite3
import os
from datetime import datetime

def migrate_invoices():
    """Migrate the database to support multiple invoices per purchase order"""
    
    # Connect to the database
    db_path = "inventory.db"
    if not os.path.exists(db_path):
        print("Database file not found. Please run the application first to create the database.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Starting invoice migration...")
        
        # Check if invoices table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'")
        if cursor.fetchone():
            print("Invoices table already exists. Migration may have been run before.")
            return
        
        # Create the invoices table
        print("Creating invoices table...")
        cursor.execute("""
            CREATE TABLE invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                purchase_order_id INTEGER NOT NULL,
                invoice_number VARCHAR NOT NULL,
                invoice_date DATETIME NOT NULL,
                amount FLOAT NOT NULL DEFAULT 0.0,
                description TEXT,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id) ON DELETE CASCADE
            )
        """)
        
        # Create index on invoice_number
        cursor.execute("CREATE INDEX ix_invoices_invoice_number ON invoices (invoice_number)")
        
        # Check if purchase_orders table has invoice_number column
        cursor.execute("PRAGMA table_info(purchase_orders)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'invoice_number' in columns:
            print("Migrating existing invoice data...")
            
            # Get all purchase orders with invoice numbers
            cursor.execute("SELECT id, invoice_number FROM purchase_orders WHERE invoice_number IS NOT NULL AND invoice_number != ''")
            po_invoices = cursor.fetchall()
            
            # Create invoice records for existing data
            for po_id, invoice_number in po_invoices:
                if invoice_number and invoice_number.strip():
                    cursor.execute("""
                        INSERT INTO invoices (purchase_order_id, invoice_number, invoice_date, amount, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    """, (po_id, invoice_number, datetime.now().isoformat(), 0.0, datetime.now().isoformat()))
            
            print(f"Migrated {len(po_invoices)} existing invoice records")
            
            # Remove the invoice_number column from purchase_orders table
            print("Removing invoice_number column from purchase_orders table...")
            
            # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
            cursor.execute("PRAGMA table_info(purchase_orders)")
            columns_info = cursor.fetchall()
            
            # Get all columns except invoice_number
            new_columns = []
            for col in columns_info:
                if col[1] != 'invoice_number':
                    new_columns.append(col[1])
            
            # Create new table structure
            columns_def = []
            for col in columns_info:
                if col[1] != 'invoice_number':
                    col_def = f"{col[1]} {col[2]}"
                    if col[3]:  # NOT NULL
                        col_def += " NOT NULL"
                    if col[4]:  # DEFAULT
                        col_def += f" DEFAULT {col[4]}"
                    if col[5]:  # PRIMARY KEY
                        col_def += " PRIMARY KEY"
                    columns_def.append(col_def)
            
            # Create new table
            cursor.execute(f"""
                CREATE TABLE purchase_orders_new (
                    {', '.join(columns_def)}
                )
            """)
            
            # Copy data to new table
            cursor.execute(f"""
                INSERT INTO purchase_orders_new 
                SELECT {', '.join(new_columns)} 
                FROM purchase_orders
            """)
            
            # Drop old table and rename new table
            cursor.execute("DROP TABLE purchase_orders")
            cursor.execute("ALTER TABLE purchase_orders_new RENAME TO purchase_orders")
            
            # Recreate indexes
            cursor.execute("CREATE INDEX ix_purchase_orders_po_number ON purchase_orders (po_number)")
            cursor.execute("CREATE INDEX ix_purchase_orders_id ON purchase_orders (id)")
        
        # Commit changes
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_invoices() 