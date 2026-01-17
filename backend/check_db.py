"""
Quick script to check if database connection works and if admin user exists
"""
import pymysql

try:
    # Connect to database
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='admin1234',
        database='surgitrack',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    print("[OK] Database connection successful!")
    
    with connection.cursor() as cursor:
        # Check if users table exists
        cursor.execute("SHOW TABLES LIKE 'users'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("[ERROR] Table 'users' does not exist!")
            print("[INFO] Please run the SQL setup script first")
        else:
            print("[OK] Table 'users' exists")
            
            # Check if admin user exists
            cursor.execute("SELECT id, username, full_name, role, is_active FROM users WHERE username = 'admin'")
            admin_user = cursor.fetchone()
            
            if not admin_user:
                print("[ERROR] Admin user does not exist in database!")
                print("[INFO] Please run the SQL script to create admin user")
            else:
                print("[OK] Admin user found:")
                print(f"   ID: {admin_user['id']}")
                print(f"   Username: {admin_user['username']}")
                print(f"   Full Name: {admin_user['full_name']}")
                print(f"   Role: {admin_user['role']}")
                print(f"   Active: {admin_user['is_active']}")
                
                # Show password hash for verification
                cursor.execute("SELECT password_hash FROM users WHERE username = 'admin'")
                hash_result = cursor.fetchone()
                print(f"\n[INFO] Password hash starts with: {hash_result['password_hash'][:20]}...")
        
    connection.close()
    
except pymysql.err.OperationalError as e:
    print(f"[ERROR] Could not connect to database: {e}")
    print("[INFO] Make sure MySQL is running and password is correct")
except Exception as e:
    print(f"[ERROR] Unexpected error: {e}")
