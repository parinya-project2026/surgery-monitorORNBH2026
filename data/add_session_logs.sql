USE surgitrack;

-- สร้าง Session Logs Table สำหรับบันทึกการเข้าระบบ (PDPA Audit)
CREATE TABLE IF NOT EXISTS session_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ลบข้อมูลเก่าเพื่อให้ลงทะเบียนใหม่ได้
DELETE FROM session_logs;
DELETE FROM status_history;
DELETE FROM patients;
DELETE FROM users;

-- ตรวจสอบว่าสร้างสำเร็จ
SHOW TABLES;
