// OR Schedule Configuration - ตารางแพทย์ประจำห้องผ่าตัด

// ห้องผ่าตัด
export const ALL_OR_ROOMS = [
    'ห้องผ่าตัด 1',
    'ห้องผ่าตัด 2',
    'ห้องผ่าตัด 3',
    'ห้องผ่าตัด 4',
    'ห้องผ่าตัด 5',
    'ห้องผ่าตัด 6',
    'ห้องผ่าตัด 8',
];

// ================== CONFIG: ตารางแพทย์ประจำ OR ==================
// Monday=0 ... Friday=4
type DoctorSchedule = {
    doctor: string | string[];
    when: 'ALLDAY' | 'AM' | 'PM';
    weeks: number[];
};

export const WEEKLY_DOCTOR_OR_PLAN: Record<number, Record<string, DoctorSchedule[]>> = {
    0: { // Monday
        'OR1': [{ doctor: 'นพ.สุริยา คุณาชน', when: 'ALLDAY', weeks: [1] }, { doctor: 'พญ.รัฐพร ตั้งเพียร', when: 'ALLDAY', weeks: [2] }, { doctor: 'นพ.พิชัย สุวัฒนพูนลาภ', when: 'ALLDAY', weeks: [3] }, { doctor: 'นพ.ธนวัฒน์ พันธุ์พรหม', when: 'ALLDAY', weeks: [4] }],
        'OR2': [{ doctor: 'นพ.ณัฐพงศ์ ศรีโพนทอง', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR3': [{ doctor: 'พญ.พิรุณยา แสนวันดี', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR5': [{ doctor: 'OBGYN_ANY', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR6': [{ doctor: 'OBGYN_ANY', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR8': [{ doctor: 'พญ.สีชมพู ตั้งสัตยาธิษฐาน', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
    },
    1: { // Tuesday
        'OR1': [{ doctor: 'พญ.สายฝน บรรณจิตร์', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR2': [{ doctor: 'นพ.ชัชพล องค์โฆษิต', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR3': [{ doctor: 'พญ.สุภาภรณ์ พิณพาทย์', when: 'AM', weeks: [1, 2, 3, 4] }, { doctor: 'ทพญ.อรุณนภา คิสารัง', when: 'PM', weeks: [1, 2, 3, 4] }],
        'OR5': [{ doctor: 'OBGYN_ANY', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR6': [{ doctor: 'นพ.พิชัย สุวัฒนพูนลาภ', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR8': [{ doctor: 'พญ.สาวิตรี ถนอมวงศ์ไทย', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
    },
    2: { // Wednesday
        'OR1': [{ doctor: 'นพ.สุริยา คุณาชน', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR2': [{ doctor: 'นพ.วิษณุ ผูกพันธ์', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR3': [{ doctor: 'CLOSED', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR5': [{ doctor: 'OBGYN_ANY', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR6': [{ doctor: 'พญ.รัฐพร ตั้งเพียร', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR8': [{ doctor: 'พญ.นันท์นภัส ชีวะเกรียงไกร', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
    },
    3: { // Thursday
        'OR1': [{ doctor: 'พญ.สายฝน บรรณจิตร์', when: 'AM', weeks: [1, 2, 3, 4] }, { doctor: 'นพ.ชัชพล องค์โฆษิต', when: 'PM', weeks: [1, 3] }, { doctor: ['นพ.ณัฐพงศ์ ศรีโพนทอง', 'นพ.วิษณุ ผูกพันธ์'], when: 'PM', weeks: [2, 4] }],
        'OR2': [{ doctor: 'นพ.อำนาจ อนันต์วัฒนกุล', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR3': [{ doctor: 'นพ.วรวิช พลเวียงธรรม', when: 'AM', weeks: [1, 2, 3, 4] }, { doctor: 'ทพ.ฉลองรัฐ เดชา', when: 'PM', weeks: [1, 2, 3, 4] }],
        'OR5': [{ doctor: 'OBGYN_ANY', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR6': [{ doctor: 'นพ.ธนวัฒน์ พันธุ์พรหม', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR8': [{ doctor: 'พญ.ดวิษา อังศรีประเสริฐ', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
    },
    4: { // Friday
        'OR1': [{ doctor: 'พญ.สุภาภรณ์ พิณพาทย์', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR2': [{ doctor: 'นพ.กฤษฎา อิ้งอำพร', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR3': [{ doctor: 'พญ.สุทธิพร หมวดไธสง', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR5': [{ doctor: 'OBGYN_ANY', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR6': [{ doctor: 'CLOSED', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
        'OR8': [{ doctor: 'นพ.สราวุธ สารีย์', when: 'ALLDAY', weeks: [1, 2, 3, 4] }],
    },
};

// ================== MASTER DATA ==================

// แผนกผ่าตัด
export const DEPARTMENTS = [
    { id: 'Surgery', name: 'Surgery | ศัลยกรรมทั่วไป' },
    { id: 'Orthopedics', name: 'Orthopedics | ศัลยกรรมกระดูกและข้อ' },
    { id: 'Urology', name: 'Urology | ศัลยกรรมระบบทางเดินปัสสาวะ' },
    { id: 'ENT', name: 'ENT | ศัลยกรรม โสต ศอ นาสิก' },
    { id: 'OBGYN', name: 'Obstetrics-Gynecology | สูติ-นรีเวช' },
    { id: 'Ophthalmology', name: 'Ophthalmology | จักษุ' },
    { id: 'Maxillofacial', name: 'Maxillofacial | ศัลยกรรมขากรรไกร' },
];

// แพทย์ผ่าตัด แยกตามแผนก
export const SURGEONS: Record<string, string[]> = {
    Surgery: [
        'นพ.สุริยา คุณาชน',
        'นพ.ธนวัฒน์ พันธุ์พรหม',
        'พญ.สุภาภรณ์ พิณพาทย์',
        'พญ.รัฐพร ตั้งเพียร',
        'นพ.พิชัย สุวัฒนพูนลาภ',
    ],
    Orthopedics: [
        'นพ.ชัชพล องค์โฆษิต',
        'นพ.ณัฐพงศ์ ศรีโพนทอง',
        'นพ.อำนาจ อนันต์วัฒนกุล',
        'นพ.อภิชาติ ลักษณะ',
        'นพ.กฤษฎา อิ้งอำพร',
        'นพ.วิษณุ ผูกพันธ์',
    ],
    Urology: ['พญ.สายฝน บรรณจิตร์'],
    ENT: [
        'พญ.พิรุณยา แสนวันดี',
        'พญ.สุทธิพร หมวดไธสง',
        'นพ.วรวิช พลเวียงธรรม',
    ],
    OBGYN: [
        'นพ.สุรจิตต์ นิมิตรวงษ์สกุล',
        'พญ.ขวัญตา ทุนประเทือง',
        'พญ.วัชราภรณ์ อนวัชชกุล',
        'พญ.รุ่งฤดี โขมพัตร',
        'พญ.ฐิติมน ชัยชนะทรัพย์',
    ],
    Ophthalmology: [
        'นพ.สราวุธ สารีย์',
        'พญ.ดวิษา อังศรีประเสริฐ',
        'พญ.สาวิตรี ถนอมวงศ์ไทย',
        'พญ.สีชมพู ตั้งสัตยาธิษฐาน',
        'พญ.นันท์นภัส ชีวะเกรียงไกร',
    ],
    Maxillofacial: ['ทพ.ฉลองรัฐ เดชา', 'ทพญ.อรุณนภา คิสารัง'],
};

// Doctor Groups (Linked to SURGEONS to ensure Single Source of Truth)
export const DOCTOR_GROUPS: Record<string, string[]> = {
    SUR_ANY: SURGEONS.Surgery,
    ORTHO_ANY: SURGEONS.Orthopedics,
    URO_ANY: SURGEONS.Urology,
    ENT_ANY: SURGEONS.ENT,
    OBGYN_ANY: SURGEONS.OBGYN,
    EYE_ANY: SURGEONS.Ophthalmology,
    MAXILO_ANY: SURGEONS.Maxillofacial,
};

// Helper: Get week of month (1-4)
export const getWeekOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const firstDayOfWeek = firstDay.getDay();
    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
};

// Helper: Normalize name for fuzzy matching (remove spaces, lowercase, handle common typos)
const normalizeName = (name: string): string => {
    return name
        .replace(/\s+/g, '')
        .toLowerCase()
        .replace(/ทัย$/g, 'ไทย') // Common typo: ทัย -> ไทย
        .replace(/ศักดิ์$/g, 'ศักดิ') // Common typo variants
        .trim();
};

// Helper: Fuzzy match surgeon name
const fuzzyMatchSurgeon = (inputName: string, targetName: string): boolean => {
    const norm1 = normalizeName(inputName);
    const norm2 = normalizeName(targetName);

    // Exact match after normalization
    if (norm1 === norm2) return true;

    // Check if first 80% of characters match (for minor typos at end)
    const minLen = Math.min(norm1.length, norm2.length);
    const checkLen = Math.floor(minLen * 0.8);
    if (checkLen > 5 && norm1.substring(0, checkLen) === norm2.substring(0, checkLen)) {
        return true;
    }

    return false;
};

// Helper: Check if surgeon matches a doctor entry (handles groups)
export const matchesDoctorEntry = (surgeon: string, doctorEntry: string | string[]): boolean => {
    const doctors = Array.isArray(doctorEntry) ? doctorEntry : [doctorEntry];
    for (const doc of doctors) {
        if (doc === surgeon) return true;
        if (fuzzyMatchSurgeon(surgeon, doc)) return true;
        if (doc.endsWith('_ANY') && DOCTOR_GROUPS[doc]?.some(d => fuzzyMatchSurgeon(surgeon, d))) return true;
    }
    return false;
};

// Get surgeon's department ID
export const getSurgeonDepartment = (surgeon: string): string | null => {
    for (const [deptId, doctors] of Object.entries(SURGEONS)) {
        // Use fuzzy matching
        if (doctors.some(d => fuzzyMatchSurgeon(surgeon, d))) return deptId;
    }
    return null;
};

// Get OR room for surgeon based on date and time
export const getSurgeonORRoom = (surgeon: string, date?: Date, time?: string): string => {
    const targetDate = date || new Date();
    const weekday = targetDate.getDay() - 1; // Mon=0
    if (weekday < 0 || weekday > 4) return ''; // Weekend

    const weekOfMonth = getWeekOfMonth(targetDate);
    const daySchedule = WEEKLY_DOCTOR_OR_PLAN[weekday];
    if (!daySchedule) return '';

    let period: 'AM' | 'PM' = 'AM';
    if (time) {
        const hour = parseInt(time.split(':')[0], 10);
        period = hour >= 12 ? 'PM' : 'AM';
    }

    // 1. First Pass: Try to find EXACT surgeon match (Owner)
    for (const [orCode, schedules] of Object.entries(daySchedule)) {
        for (const schedule of schedules) {
            if (!schedule.weeks.includes(weekOfMonth)) continue;
            if (schedule.when !== 'ALLDAY' && schedule.when !== period) continue;
            if (matchesDoctorEntry(surgeon, schedule.doctor)) {
                const roomNum = orCode.replace('OR', '');
                return `ห้องผ่าตัด ${roomNum}`;
            }
        }
    }

    // 2. Second Pass: Start FALLBACK logic (Same Department)
    // Find surgeon's department
    const surgeonDept = getSurgeonDepartment(surgeon);
    if (!surgeonDept) return ''; // Unknown Department -> Unassigned

    for (const [orCode, schedules] of Object.entries(daySchedule)) {
        for (const schedule of schedules) {
            if (!schedule.weeks.includes(weekOfMonth)) continue;
            if (schedule.when !== 'ALLDAY' && schedule.when !== period) continue;

            // Check if this room's owner belongs to the SAME department
            const doctorEntries = Array.isArray(schedule.doctor) ? schedule.doctor : [schedule.doctor];

            for (const docEntry of doctorEntries) {
                // Skip special keywords
                if (docEntry === 'CLOSED') continue;

                // Expand Group
                let effectiveDoctors: string[] = [];
                if (docEntry.endsWith('_ANY') && DOCTOR_GROUPS[docEntry]) {
                    effectiveDoctors = DOCTOR_GROUPS[docEntry];
                } else {
                    effectiveDoctors = [docEntry];
                }

                // Check departments of room owners
                for (const roomOwner of effectiveDoctors) {
                    const ownerDept = getSurgeonDepartment(roomOwner);
                    if (ownerDept === surgeonDept) {
                        // FOUND MATCHING DEPARTMENT ROOM!
                        const roomNum = orCode.replace('OR', '');
                        return `ห้องผ่าตัด ${roomNum}`;
                    }
                }
            }
        }
    }

    return '';
};

// Get schedule info for OR room display
export const getORScheduleForDate = (date: Date): Record<string, { doctor: string; period: string }> => {
    const weekday = date.getDay() - 1;
    if (weekday < 0 || weekday > 4) return {};

    const weekOfMonth = getWeekOfMonth(date);
    const daySchedule = WEEKLY_DOCTOR_OR_PLAN[weekday];
    if (!daySchedule) return {};

    const result: Record<string, { doctor: string; period: string }> = {};

    for (const [orCode, schedules] of Object.entries(daySchedule)) {
        const roomName = `ห้องผ่าตัด ${orCode.replace('OR', '')}`;
        const doctors: string[] = [];
        let period = '';

        for (const schedule of schedules) {
            if (!schedule.weeks.includes(weekOfMonth)) continue;
            const docNames = Array.isArray(schedule.doctor) ? schedule.doctor : [schedule.doctor];
            doctors.push(...docNames);
            if (schedule.when === 'ALLDAY') period = 'ทั้งวัน';
            else if (schedule.when === 'AM') period = period ? `${period}/เช้า` : 'เช้า';
            else period = period ? `${period}/บ่าย` : 'บ่าย';
        }

        if (doctors.length > 0) {
            const doctorDisplay = doctors[0] === 'CLOSED' ? 'ปิดห้อง' :
                doctors.map(d => d.endsWith('_ANY') ? d.replace('_ANY', '') : d).join(', ');
            result[roomName] = { doctor: doctorDisplay, period };
        }
    }
    return result;
};

// Get surgery type based on START time
export const getSurgeryType = (startTime: string): 'elective' | 'emergency' => {
    if (!startTime) return 'elective'; // Default to elective if no time

    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // Elective: 08:30 (510) to 16:30 (990)
    const electiveStart = 8 * 60 + 30; // 510
    const electiveEnd = 16 * 60 + 30; // 990

    return totalMinutes >= electiveStart && totalMinutes < electiveEnd ? 'elective' : 'emergency';
};
