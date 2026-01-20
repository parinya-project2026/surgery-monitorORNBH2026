"""
Script to add or update a user in SurgiTrack
This script does NOT delete existing data - it only adds/updates users

Usage: python add_user.py [username] [password] [role]
Default: admin / admin123 / admin
"""
import sys
import pymysql
from passlib.context import CryptContext

# Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get arguments or use defaults
username = sys.argv[1] if len(sys.argv) > 1 else "admin"
password = sys.argv[2] if len(sys.argv) > 2 else "admin123"
role = sys.argv[3] if len(sys.argv) > 3 else "admin"
full_name = f"User {username}" if username != "admin" else "System Administrator"

print(f"[INFO] Adding/updating user: {username}")

# Database connection
connection = pymysql.connect(
    host='localhost',
    user='root',
    password='admin1234',
    database='surgitrack',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with connection.cursor() as cursor:
        # Hash the password
        hashed_password = pwd_context.hash(password)
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            # Update existing user
            sql = """
            UPDATE users 
            SET password_hash = %s, is_active = TRUE 
            WHERE username = %s
            """
            cursor.execute(sql, (hashed_password, username))
            print(f"[OK] User '{username}' password updated!")
        else:
            # Insert new user
            sql = """
            INSERT INTO users (username, password_hash, full_name, role, is_active)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (username, hashed_password, full_name, role, True))
            print(f"[OK] User '{username}' created!")
        
        connection.commit()
        
        # Verify
        cursor.execute("SELECT id, username, role, is_active FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if user:
            print(f"\n[SUCCESS] Login credentials:")
            print(f"   Username: {username}")
            print(f"   Password: {password}")
            print(f"   Role: {user['role']}")
        
finally:
    connection.close()
