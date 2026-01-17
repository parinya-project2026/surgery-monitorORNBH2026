-- ===================================
-- SurgiTrack Database Setup Script
-- Complete Version - Run All at Once
-- ===================================

-- สร้าง Database
CREATE DATABASE IF NOT EXISTS surgitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE surgitrack;

-- ลบ Tables เดิม (ถ้ามี) - ต้องลบตามลำดับเพราะมี Foreign Key
DROP TABLE IF EXISTS surgery_registrations;
DROP TABLE IF EXISTS session_logs;
DROP TABLE IF EXISTS status_history;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;

-- ===================================
-- สร้างตาราง Users
-- ===================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'nurse') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===================================
-- สร้างตาราง Patients
-- ===================================
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hn VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    age INT,
    gender ENUM('male', 'female', 'other'),
    diagnosis VARCHAR(255),
    operation VARCHAR(255),
    surgeon VARCHAR(100),
    anesthesiologist VARCHAR(100),
    or_room VARCHAR(20),
    patient_type ENUM('elective', 'emergency') NOT NULL,
    status ENUM('waiting', 'in_surgery', 'recovering', 'postponed', 'returning') DEFAULT 'waiting',
    scheduled_date DATE,
    scheduled_time TIME,
    actual_start_time DATETIME,
    actual_end_time DATETIME,
    notes TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ===================================
-- สร้างตาราง Status History (PDPA Audit Log)
-- ===================================
CREATE TABLE status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by INT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ===================================
-- สร้างตาราง Session Logs (Login/Logout Audit)
-- user_id สามารถเป็น NULL ได้ (สำหรับ failed login ของ user ที่ไม่มีในระบบ)
-- ===================================
CREATE TABLE session_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ===================================
-- สร้างตาราง Surgery Registrations (ลงทะเบียนผ่าตัด)
-- ===================================
CREATE TABLE surgery_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Patient Information
    hn VARCHAR(20) NOT NULL COMMENT 'Hospital Number',
    patient_name VARCHAR(255) NOT NULL COMMENT 'ชื่อ-สกุล',
    age INT NOT NULL COMMENT 'อายุ (ปี)',
    
    -- Surgery Schedule
    surgery_date DATE NOT NULL COMMENT 'วันที่ผ่าตัด',
    scheduled_time TIME NOT NULL COMMENT 'เวลาสั่งผ่าตัด',
    surgery_type ENUM('elective', 'emergency') NOT NULL COMMENT 'ประเภท: elective=ในเวลา, emergency=นอกเวลา',
    or_room VARCHAR(20) NOT NULL COMMENT 'ห้องผ่าตัด',
    
    -- Medical Information
    department VARCHAR(50) NOT NULL COMMENT 'แผนก',
    surgeon VARCHAR(100) NOT NULL COMMENT 'แพทย์ผู้สั่ง',
    diagnosis TEXT NOT NULL COMMENT 'การวินิจฉัยเบื้องต้น',
    operation TEXT NOT NULL COMMENT 'ชื่อการผ่าตัด',
    ward VARCHAR(100) NOT NULL COMMENT 'หอผู้ป่วย',
    case_size ENUM('Major', 'Minor') NOT NULL COMMENT 'ขนาดเคส',
    
    -- Actual Surgery Times (Optional)
    start_time TIME NULL COMMENT 'เวลาเริ่มผ่าตัดจริง',
    end_time TIME NULL COMMENT 'เวลาเสร็จผ่าตัด',
    
    -- Nursing Staff (Optional)
    assist1 VARCHAR(100) NULL COMMENT 'พยาบาล Assist 1',
    assist2 VARCHAR(100) NULL COMMENT 'พยาบาล Assist 2',
    scrub_nurse VARCHAR(100) NULL COMMENT 'Scrub Nurse',
    circulate_nurse VARCHAR(100) NULL COMMENT 'Circulate Nurse',
    
    -- Queue Management
    queue_order INT NULL COMMENT 'ลำดับคิว',
    selected_or VARCHAR(20) NULL COMMENT 'ห้องผ่าตัดที่เลือก (Emergency)',
    
    -- Status
    status ENUM('registered', 'waiting', 'in_surgery', 'recovery', 'completed', 'cancelled', 'not_ready') DEFAULT 'registered' COMMENT 'สถานะ',
    not_ready_reason VARCHAR(100) NULL COMMENT 'สาเหตุไม่พร้อม',
    
    -- Metadata
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_surgery_date (surgery_date),
    INDEX idx_surgery_type (surgery_type),
    INDEX idx_status (status),
    INDEX idx_hn (hn),
    INDEX idx_or_room (or_room)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางลงทะเบียนผ่าตัด';

-- ===================================
-- ตรวจสอบว่าสร้างสำเร็จ
-- ===================================
SHOW TABLES;

-- แสดงโครงสร้าง session_logs เพื่อยืนยันว่า user_id เป็น NULL ได้
DESCRIBE session_logs;
DESCRIBE surgery_registrations;

SELECT 'All tables created successfully!' AS message;
