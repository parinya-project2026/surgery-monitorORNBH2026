from sqlalchemy import create_engine, text
from datetime import datetime

DATABASE_URL = "mysql+pymysql://root:Admin%401234@localhost:3306/surgitrack"
engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    print(f"Current server time: {datetime.now()}")
    print("\nRecent session logs (last 20):")
    result = connection.execute(text("SELECT * FROM session_logs ORDER BY created_at DESC LIMIT 20"))
    logs = result.fetchall()
    for log in logs:
        print(log)
