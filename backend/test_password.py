"""
Test passlib verify_password to see if it works with our hash
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# The hash from database
stored_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.6HlXfWJXpNqDCe"
plain_password = "admin123"

try:
    result = pwd_context.verify(plain_password, stored_hash)
    print(f"[TEST] Password verification: {result}")
    if result:
        print("[OK] Password matches!")
    else:
        print("[ERROR] Password does not match")
except Exception as e:
    print(f"[ERROR] Verification failed: {e}")
    print(f"[INFO] Error type: {type(e).__name__}")
