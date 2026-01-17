-- ========================================
-- SurgiTrack Database Schema
-- Surgery Registration System
-- ========================================

USE surgitrack;

-- Drop existing table if exists
DROP TABLE IF EXISTS surgery_registrations;

-- Create surgery_registrations table
CREATE TABLE surgery_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Patient Information
    hn VARCHAR(20) NOT NULL COMMENT 'Hospital Number',
    patient_name VARCHAR(255) NOT NULL COMMENT 'ชื่อ-สกุล',
    age INT NOT NULL COMMENT 'อายุ (ปี)',
    
    -- Surgery Schedule
    surgery_date DATE NOT NULL COMMENT 'วันที่ผ่าตัด',
    scheduled_time TIME NOT NULL COMMENT 'เวลานัดผ่าตัด',
    surgery_type ENUM('elective', 'emergency') NOT NULL COMMENT 'ประเภท: elective=ในเวลา, emergency=นอกเวลา',
    or_room VARCHAR(20) NOT NULL COMMENT 'ห้องผ่าตัด',
    
    -- Medical Information
    department VARCHAR(50) NOT NULL COMMENT 'แผนก',
    surgeon VARCHAR(100) NOT NULL COMMENT 'แพทย์ผ่าตัด',
    diagnosis TEXT NOT NULL COMMENT 'Diagnosis',
    operation TEXT NOT NULL COMMENT 'Operation',
    ward VARCHAR(100) NOT NULL COMMENT 'หอผู้ป่วย',
    case_size ENUM('Major', 'Minor') NOT NULL COMMENT 'ขนาดเคส',
    
    -- Actual Surgery Times (Optional - filled after surgery)
    start_time TIME NULL COMMENT 'เวลาเริ่มผ่าตัดจริง',
    end_time TIME NULL COMMENT 'เวลาเสร็จผ่าตัด',
    
    -- Nursing Staff (Optional)
    assist1 VARCHAR(100) NULL COMMENT 'พยาบาล Assist 1',
    assist2 VARCHAR(100) NULL COMMENT 'พยาบาล Assist 2',
    scrub_nurse VARCHAR(100) NULL COMMENT 'Scrub Nurse',
    circulate_nurse VARCHAR(100) NULL COMMENT 'Circulate Nurse',
    
    -- Status Tracking
    status ENUM('registered', 'waiting', 'in_surgery', 'recovery', 'completed', 'cancelled') DEFAULT 'registered',
    
    -- Metadata
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_surgery_date (surgery_date),
    INDEX idx_or_room (or_room),
    INDEX idx_surgeon (surgeon),
    INDEX idx_department (department),
    INDEX idx_status (status),
    INDEX idx_surgery_type (surgery_type),
    
    -- Foreign Key
    CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Insert sample data for testing
-- ========================================
-- You can uncomment these to add test data
/*
INSERT INTO surgery_registrations 
(hn, patient_name, age, surgery_date, scheduled_time, surgery_type, or_room, department, surgeon, diagnosis, operation, ward, case_size, status)
VALUES
('123456', 'นายทดสอบ ระบบ', 45, CURDATE(), '09:00:00', 'elective', 'ห้องผ่าตัด 1', 'Surgery', 'นพ.สุริยา คุณาชน', 'Acute appendicitis', 'Appendectomy', 'หอผู้ป่วยศัลยกรรมชาย', 'Minor', 'registered'),
('789012', 'นางสาวทดสอบ ระบบ', 35, CURDATE(), '10:30:00', 'elective', 'ห้องผ่าตัด 2', 'Orthopedics', 'นพ.ชัชพล องค์โฆษิต', 'Femoral neck fracture', 'Open Reduction and Internal Fixation (ORIF)', 'หอผู้ป่วยกระดูกและข้อ', 'Major', 'registered');
*/
