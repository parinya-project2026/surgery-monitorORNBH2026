USE surgitrack;

-- แก้ไข session_logs ให้ user_id เป็น NULL ได้
ALTER TABLE session_logs 
MODIFY COLUMN user_id INT NULL,
DROP FOREIGN KEY session_logs_ibfk_1;

-- เพิ่ม foreign key ใหม่แบบ ON DELETE SET NULL
ALTER TABLE session_logs 
ADD CONSTRAINT session_logs_ibfk_1 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ตรวจสอบผลลัพธ์
DESCRIBE session_logs;
