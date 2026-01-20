import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='admin1234',
    database='surgitrack'
)
cursor = conn.cursor()
cursor.execute('ALTER TABLE surgery_registrations MODIFY COLUMN case_size ENUM("Major", "Minor") NULL')
conn.commit()
print('SUCCESS: case_size column updated to allow NULL')
conn.close()
