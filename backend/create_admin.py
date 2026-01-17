"""
Script to create the first admin user in SurgiTrack
Run this to create admin user: username=admin, password=admin123
"""
import pymysql
from passlib.context import CryptContext

# Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database connection
connection = pymysql.connect(
    host='localhost',
    user='root',
    password='Admin@1234',
    database='surgitrack',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with connection.cursor() as cursor:
        # Clear all tables first (in order due to foreign keys)
        print("[INFO] Clearing existing data...")
        cursor.execute("DELETE FROM session_logs")
        cursor.execute("DELETE FROM status_history")
        cursor.execute("DELETE FROM patients")
        cursor.execute("DELETE FROM users")
        connection.commit()
        print("[OK] All tables cleared")
        
        # Hash the password
        password = "admin123"
        hashed_password = pwd_context.hash(password)
        
        # Create admin user
        print("\n[INFO] Creating admin user...")
        sql = """
        INSERT INTO users (username, password_hash, full_name, role, is_active)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(sql, ('admin', hashed_password, 'ผู้ดูแลระบบ', 'admin', True))
        connection.commit()
        
        # Verify
        cursor.execute("SELECT id, username, full_name, role FROM users WHERE username='admin'")
        user = cursor.fetchone()
        
        if user:
            print("[OK] Admin user created successfully!")
            print(f"   ID: {user['id']}")
            print(f"   Username: {user['username']}")
            print(f"   Full Name: {user['full_name']}")
            print(f"   Role: {user['role']}")
            print("\n[SUCCESS] You can now login with:")
            print("   Username: admin")
            print("   Password: admin123")
        else:
            print("[ERROR] Failed to create user")
            
finally:
    connection.close()

