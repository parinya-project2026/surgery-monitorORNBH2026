-- Fix surgery_registrations table to allow NULL values for incomplete import
-- Run this in MySQL to update existing table structure

USE surgitrack;

-- Modify columns to allow NULL
ALTER TABLE surgery_registrations 
    MODIFY COLUMN age INT NULL DEFAULT 0 COMMENT 'อายุ (ปี)',
    MODIFY COLUMN surgery_date DATE NULL COMMENT 'วันที่ผ่าตัด',
    MODIFY COLUMN scheduled_time TIME NULL COMMENT 'เวลาสั่งผ่าตัด',
    MODIFY COLUMN surgery_type ENUM('elective', 'emergency') NULL DEFAULT 'elective' COMMENT 'ประเภท',
    MODIFY COLUMN or_room VARCHAR(20) NULL COMMENT 'ห้องผ่าตัด',
    MODIFY COLUMN department VARCHAR(50) NULL COMMENT 'แผนก',
    MODIFY COLUMN surgeon VARCHAR(100) NULL COMMENT 'แพทย์ผู้สั่ง',
    MODIFY COLUMN diagnosis TEXT NULL COMMENT 'การวินิจฉัยเบื้องต้น',
    MODIFY COLUMN operation TEXT NULL COMMENT 'ชื่อการผ่าตัด',
    MODIFY COLUMN ward VARCHAR(100) NULL COMMENT 'หอผู้ป่วย';

-- Verify changes
DESCRIBE surgery_registrations;

SELECT 'Table modified successfully!' AS message;
