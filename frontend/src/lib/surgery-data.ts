// Master Data สำหรับระบบลงทะเบียนผ่าตัด

import { getSurgeonORRoom, ALL_OR_ROOMS, DEPARTMENTS, SURGEONS, matchesDoctorEntry } from './or-schedule';

// Interfaces
export interface ElectivePatient {
    id: string;
    hn: string;
    patientName: string;
    age: string | number;
    department: string;
    departmentName?: string;
    surgeon: string;
    diagnosis: string;
    operation: string;
    ward: string;
    caseSize: string;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    assist1?: string;
    assist2?: string;
    scrubNurse?: string;
    circulate?: string;
    orRoom: string;
    scheduledTime: string; // HH:MM
    status?: string | 'pending' | 'completed' | 'canceled';
    surgeryType?: 'elective' | 'emergency';
    notReadyReason?: string;
    createdAt?: string;
}

// Re-export constants
export const OR_ROOMS = ALL_OR_ROOMS;
export { getSurgeonORRoom, DEPARTMENTS, SURGEONS, matchesDoctorEntry };

// Operation (การผ่าตัด) แยกตามแผนก
export const OPERATIONS: Record<string, string[]> = {
    Surgery: [
        'Appendectomy',
        'Laparoscopic Cholecystectomy (LC)',
        'Open Cholecystectomy (OC)',
        'Common Bile Duct Exploration',
        'Herniorrhaphy / Hernioplasty',
        'Hemorrhoidectomy',
        'Mastectomy',
        'Thyroidectomy',
        'Exploratory Laparotomy',
        'Colectomy',
        'Gastrectomy',
        'Splenectomy',
    ],
    Orthopedics: [
        'TR (Total Knee Replacement)',
        'THR (Total Hip Replacement)',
        'ORIF (Open Reduction Internal Fixation)',
        'Arthroscopy',
        'Spine Surgery (Laminectomy / Discectomy)',
        'Carpal Tunnel Release',
        'Trigger Finger Release',
        'Amputation',
    ],
    Urology: [
        'Cystoscopy',
        'TURP (Transurethral Resection of the Prostate)',
        'TURBT',
        'URS (Ureteroscopy)',
        'PCNL',
        'Nephrectomy',
        'Prostatectomy',
    ],
    ENT: [
        'Tonsillectomy',
        'Adenoidectomy',
        'Septoplasty',
        'FESS (Functional Endoscopic Sinus Surgery)',
        'Thyroidectomy',
        'Mastoidectomy',
        'Tympanoplasty',
    ],
    OBGYN: [
        'Cesarean Section',
        'Total Abdominal Hysterectomy (TAH)',
        'Laparoscopic Hysterectomy',
        'Myomectomy',
        'Oophorectomy',
        'Tubal Ligation (TR)',
        'D&C',
    ],
    Ophthalmology: [
        'Phacoemulsification (Cataract Surgery)',
        'Pterygium Excision',
        'Vitrectomy',
        'Trabeculectomy',
        'Eyelid Surgery',
    ],
    Maxillofacial: [
        'Orthognathic Surgery',
        'Mandibular Fracture Repair',
        'Maxillary Fracture Repair',
        'Cleft Lip / Palate Repair',
        'Tooth Extraction (Complex)',
    ],
};

// Diagnosis (การวินิจฉัย) แยกตามแผนก
export const DIAGNOSES: Record<string, string[]> = {
    Surgery: [
        'Acute Appendicitis',
        'Gallstone / Cholecystitis',
        'Hernia (Inguinal / Umbilical)',
        'Hemorrhoids',
        'Breast Mass / CA Breast',
        'Thyroid Nodule / Goiter',
        'Gut Obstruction',
        'Peritonitis',
        'Colon Cancer',
    ],
    Orthopedics: [
        'Fracture',
        'OA Knee (Osteoarthritis)',
        'OA Hip',
        'Herniated Disc',
        'Carpal Tunnel Syndrome',
        'Trigger Finger',
        'Osteomyelitis',
        'Septic Arthritis',
    ],
    Urology: [
        'Renal Stone',
        'Ureteric Stone',
        'BPH (Benign Prostatic Hyperplasia)',
        'Bladder Tumor',
        'Prostate Cancer',
        'Hematuria',
    ],
    ENT: [
        'Chronic Tonsillitis',
        'Adenoid Hypertrophy',
        'Deviated Nasal Septum',
        'Chronic Sinusitis',
        'Thyroid Mass',
        'Otitis Media',
        'Hearing Loss',
    ],
    OBGYN: [
        'Pregnancy / Labor',
        'Uterine Myoma',
        'Ovarian Cyst',
        'Endometriosis',
        'Cervical Cancer',
        'Abnormal Uterine Bleeding',
    ],
    Ophthalmology: [
        'Cataract',
        'Pterygium',
        'Glaucoma',
        'Diabetic Retinopathy',
        'Retinal Detachment',
        'Strabismus',
    ],
    Maxillofacial: [
        'Skeletal Deformity',
        'Mandibular Fracture',
        'Maxillary Fracture',
        'Cleft Lip / Palate',
        'Impacted Tooth',
    ],
};

// Wards / Units
export const WARDS = [
    'Ward 1 (ศัลยกรรมชาย)',
    'Ward 2 (ศัลยกรรมหญิง)',
    'Ward 3 (กระดูกและข้อ)',
    'Ward 4 (พิเศษ 1)',
    'Ward 5 (พิเศษ 2)',
    'ICU',
    'ER',
    'OPD',
];

// พยาบาล
// พยาบาล
export const NURSES = [
    "อรุณี", "ศิวดาติ์", "กัญญณัช", "ชัญญาภัค", "สุนทรี", "พิศมัย", "เทวัญ", "กันต์พงษ์",
    "ปนัฏฐา", "สุจิตรา", "ชัยยงค์", "สุภาวัลย์", "จันทจร", "วรรณิภา", "ณัฐพงษ์", "ตะวัน",
    "ปวีณา", "นิฤมล", "ปริญญา", "สยุมพร", "สุรสิทธ์", "บุศรินทร์", "ศิริกัญญา", "นราวัตน์",
    "บัณฑิตา", "วรรณวิสา", "ชลดา", "วรีสา", "สุภกิจ",
];

// ขนาดเคส
export const CASE_SIZES = [
    'Major',
    'Medium',
    'Minor',
];
