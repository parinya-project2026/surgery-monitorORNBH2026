"""
Generate new bcrypt hash for admin123 using bcrypt 3.2.0
"""
from passlib.context import CryptContext
import pymysql

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Generate new hash for admin123
password = "admin123"
new_hash = pwd_context.hash(password)

print(f"[INFO] Generated new hash for password 'admin123':")
print(f"[HASH] {new_hash}")

# Verify it works
if pwd_context.verify(password, new_hash):
    print(f"[OK] Hash verification successful!")
else:
    print(f"[ERROR] Hash verification failed!")
    exit(1)

# Update database
try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='admin1234',
        database='surgitrack',
        charset='utf8mb4'
    )
    
    with connection.cursor() as cursor:
        sql = "UPDATE users SET password_hash = %s WHERE username = 'admin'"
        cursor.execute(sql, (new_hash,))
        connection.commit()
        
        if cursor.rowcount > 0:
            print(f"\n[SUCCESS] Updated admin user password in database!")
            print(f"[INFO] You can now login with:")
            print(f"   Username: admin")
            print(f"   Password: admin123")
        else:
            print(f"[ERROR] No user named 'admin' found in database")
    
    connection.close()
    
except Exception as e:
    print(f"[ERROR] Database update failed: {e}")
