import getpass
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import crud, schemas

if __name__ == "__main__":
    print("Create an initial user (admin or employee)")
    username = input("Username: ")
    password = getpass.getpass("Password: ")
    role = input("Role (admin/employee): ").strip().lower()
    if role not in ("admin", "employee"):
        print("Role must be 'admin' or 'employee'.")
        exit(1)

    db: Session = SessionLocal()
    existing = crud.get_user_by_username(db, username)
    if existing:
        print(f"User '{username}' already exists.")
        exit(1)
    user_in = schemas.UserCreate(username=username, password=password, role=role)
    user = crud.create_user(db, user_in)
    print(f"User '{user.username}' with role '{user.role}' created successfully.") 