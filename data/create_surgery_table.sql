-- Surgery Registrations Table for SurgiTrack
-- Run this script in MySQL Workbench

USE surgitrack;

-- Drop if exists (optional - remove if you want to keep existing data)
-- DROP TABLE IF EXISTS surgery_registrations;

-- Create surgery_registrations table
CREATE TABLE IF NOT EXISTS surgery_registrations (
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

-- Verify table created
DESCRIBE surgery_registrations;

SELECT 'Table surgery_registrations created successfully!' AS message;
