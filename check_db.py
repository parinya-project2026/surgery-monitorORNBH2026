from sqlalchemy import create_engine, text
import os

DATABASE_URL = "mysql+pymysql://root:Admin%401234@localhost:3306/surgitrack"

engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    print("Checking users table...")
    result = connection.execute(text("SELECT id, username, full_name, role, is_active FROM users"))
    users = result.fetchall()
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Full Name: {user.full_name}, Role: {user.role}, Is Active: {user.is_active}")

    print("\nChecking session logs (last 5)...")
    result = connection.execute(text("SELECT * FROM session_logs ORDER BY created_at DESC LIMIT 5"))
    logs = result.fetchall()
    for log in logs:
        print(log)
