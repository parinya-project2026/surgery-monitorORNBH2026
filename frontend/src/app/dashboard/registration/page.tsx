'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import {
    OR_ROOMS,
    DEPARTMENTS,
    SURGEONS,
    OPERATIONS,
    DIAGNOSES,
    WARDS,
    CASE_SIZES,
    NURSES,
    ElectivePatient,
    getSurgeonORRoom,
} from '@/lib/surgery-data';
import { getSurgeryType } from '@/lib/or-schedule';


// Searchable Select Component
function SearchableSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    allowCustom = false,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder: string;
    disabled?: boolean;
    allowCustom?: boolean;
    required?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        return options.filter((opt) =>
            opt.toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search]);

    const handleSelect = (opt: string) => {
        onChange(opt);
        setSearch('');
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        if (allowCustom) {
            onChange(e.target.value);
        }
        setIsOpen(true);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                ref={inputRef}
                type="text"
                value={search || value}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''
                    }`}
            />
            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredOptions.map((opt, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelect(opt)}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm first:rounded-t-xl last:rounded-b-xl"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
            {isOpen && filteredOptions.length === 0 && search && allowCustom && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3">
                    <p className="text-sm text-slate-500">
                        กด Enter เพื่อเพิ่ม &quot;{search}&quot;
                    </p>
                </div>
            )}
        </div>
    );
}

// Simple Select Component
function SimpleSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
            >
                <option value="">{placeholder}</option>
                {options.map((opt, idx) => (
                    <option key={idx} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}

// Time Input Component
function TimeInput({
    label,
    value,
    onChange,
    required = false,
    showSeconds = false,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    required?: boolean;
    showSeconds?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                step={showSeconds ? 1 : 60}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
        </div>
    );
}

// Surgery Type Badge
function SurgeryTypeBadge({ time }: { time: string }) {
    if (!time) return null;
    const type = getSurgeryType(time);
    const isElective = type === 'elective';

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${isElective
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}
        >
            <span className={`w-2 h-2 rounded-full ${isElective ? 'bg-green-500' : 'bg-orange-500'}`}></span>
            {isElective ? 'Elective (ในเวลา)' : 'Emergency (นอกเวลา)'}
        </span>
    );
}

export default function RegistrationPage() {
    // Form State
    const [form, setForm] = useState({
        orRoom: '',
        scheduledTime: '',
        hn: '',
        patientName: '',
        age: '',
        department: '',
        surgeon: '',
        diagnosis: '',
        operation: '',
        ward: '',
        caseSize: '',
        startTime: '',
        endTime: '',
        assist1: '',
        assist2: '',
        scrubNurse: '',
        circulate: '',
    });

    // Temporary Table State
    const [patients, setPatients] = useState<ElectivePatient[]>([]);
    const [saving, setSaving] = useState(false);

    // Count patients by surgery type for display
    const electiveCount = useMemo(() =>
        patients.filter((p) => (p as any).surgeryType === 'elective' || (!p.scheduledTime) || getSurgeryType(p.scheduledTime) === 'elective').length
        , [patients]);

    const emergencyCount = useMemo(() =>
        patients.filter((p) => (p as any).surgeryType === 'emergency' || (p.scheduledTime && getSurgeryType(p.scheduledTime) === 'emergency')).length
        , [patients]);

    // Get department name
    const getDepartmentName = (deptId: string) => {
        return DEPARTMENTS.find((d) => d.id === deptId)?.name || deptId;
    };

    // Get available surgeons based on selected department
    const availableSurgeons = useMemo(() => {
        if (!form.department) return [];
        return SURGEONS[form.department] || [];
    }, [form.department]);

    // Get available operations based on selected department
    const availableOperations = useMemo(() => {
        if (!form.department) return [];
        return OPERATIONS[form.department] || [];
    }, [form.department]);

    // Get available diagnoses based on selected department
    const availableDiagnoses = useMemo(() => {
        if (!form.department) return [];
        return DIAGNOSES[form.department] || [];
    }, [form.department]);

    // Handle department change - reset dependent fields
    const handleDepartmentChange = (deptId: string) => {
        const dept = DEPARTMENTS.find((d) => d.name === deptId || d.id === deptId);
        setForm({
            ...form,
            department: dept?.id || '',
            surgeon: '',
            diagnosis: '',
            operation: '',
        });
    };

    // Handle form input change
    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // Auto-assign OR Room when Surgeon or Time changes
    useEffect(() => {
        if (form.surgeon) {
            // Use current date (or selected date if we had a date picker, but for now assuming today/registration day)
            // For more accuracy, we might need a date field. Assuming registration is for "Today" or "Tomorrow"?
            // The Weekly plan is based on Weekday + WeekOfMonth.

            // If scheduledTime is provided, use it to distinguish AM/PM
            const assignedRoom = getSurgeonORRoom(form.surgeon, new Date(), form.scheduledTime || undefined);

            if (assignedRoom) {
                setForm(prev => {
                    // Only auto-update if strictly necessary or if field depends on it
                    // But here we want to auto-fill
                    if (prev.orRoom !== assignedRoom) {
                        return { ...prev, orRoom: assignedRoom };
                    }
                    return prev;
                });
            }
        }
    }, [form.surgeon, form.scheduledTime]);

    // Check if patient exists by HN (duplicate detection)
    const checkPatientByHN = async (hn: string) => {
        if (hn.length !== 9) return; // Only check when HN is complete

        try {
            const response = await fetch(`http://localhost:8000/api/surgery/check-hn/${hn}`);
            const data = await response.json();

            if (data.exists && data.history && data.history.length > 0) {
                // Build history table HTML
                const historyRows = data.history.slice(0, 5).map((s: any) => `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px; text-align: center;">${s.surgery_date || '-'}</td>
                        <td style="padding: 8px;">${s.operation || '-'}</td>
                        <td style="padding: 8px;">${s.surgeon || '-'}</td>
                        <td style="padding: 8px; text-align: center;">
                            <span style="padding: 2px 8px; border-radius: 12px; font-size: 12px; 
                                ${s.status === 'completed' ? 'background: #d1fae5; color: #065f46;' :
                        s.status === 'registered' ? 'background: #dbeafe; color: #1e40af;' :
                            'background: #f3f4f6; color: #374151;'}">
                                ${s.status || 'N/A'}
                            </span>
                        </td>
                    </tr>
                `).join('');

                const result = await Swal.fire({
                    title: `🏥 ผู้ป่วยเดิม`,
                    html: `
                        <div style="text-align: left; margin-bottom: 16px;">
                            <p style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">
                                ${data.patient.patient_name}
                            </p>
                            <p style="color: #6b7280;">
                                <strong>HN:</strong> ${data.patient.hn} | 
                                <strong>อายุ:</strong> ${data.patient.age} ปี
                            </p>
                        </div>
                        <h4 style="font-weight: 600; color: #374151; margin-bottom: 8px;">📋 ประวัติการผ่าตัด</h4>
                        <div style="max-height: 200px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead style="background: #f9fafb;">
                                    <tr>
                                        <th style="padding: 8px; text-align: center;">วันที่</th>
                                        <th style="padding: 8px; text-align: left;">Operation</th>
                                        <th style="padding: 8px; text-align: left;">แพทย์</th>
                                        <th style="padding: 8px; text-align: center;">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>${historyRows}</tbody>
                            </table>
                        </div>
                        ${data.history.length > 5 ? `<p style="color: #6b7280; font-size: 12px; margin-top: 8px;">+${data.history.length - 5} รายการ</p>` : ''}
                    `,
                    showCancelButton: true,
                    confirmButtonText: '🔄 ผ่าตัดครั้งใหม่',
                    cancelButtonText: '❌ ปิด',
                    confirmButtonColor: '#10B981',
                    cancelButtonColor: '#6B7280',
                    width: '700px',
                });

                if (result.isConfirmed) {
                    // Pre-fill form with patient data
                    setForm({
                        ...form,
                        hn: data.patient.hn,
                        patientName: data.patient.patient_name,
                        age: String(data.patient.age),
                    });
                }
            }
        } catch (error) {
            console.error('Error checking HN:', error);
        }
    };
    // ========== 2-STAGE VALIDATION ==========

    // Required fields for sending to surgery board (MINIMAL - only essential fields)
    // Other fields will be filled later on the surgery board after operation
    const REGISTRATION_REQUIRED_FIELDS = [
        { key: 'hn', label: 'HN' },
        { key: 'patientName', label: 'ชื่อ-สกุล' },
        // All other fields are optional for initial board submission
    ];

    // Additional required for Complete/Save to DB (15 required, only assist2 optional)
    const COMPLETE_REQUIRED_FIELDS = [
        ...REGISTRATION_REQUIRED_FIELDS,
        { key: 'caseSize', label: 'ขนาดเคส' },
    ];

    // Validate for registration (add to temp table)
    const validateForRegistration = (data: any): { valid: boolean; missing: string[] } => {
        const missing = REGISTRATION_REQUIRED_FIELDS
            .filter(f => !data[f.key])
            .map(f => f.label);
        return { valid: missing.length === 0, missing };
    };

    // Validate for Complete (save to DB) - includes caseSize
    const validateForComplete = (data: any): { valid: boolean; missing: string[] } => {
        const missing = COMPLETE_REQUIRED_FIELDS
            .filter(f => !data[f.key])
            .map(f => f.label);
        return { valid: missing.length === 0, missing };
    };

    // Show validation warning with SweetAlert
    const showValidationWarning = async (patientName: string, missing: string[]) => {
        await Swal.fire({
            icon: 'warning',
            title: 'ข้อมูลไม่ครบ!',
            html: `
                <p style="margin-bottom: 12px;">ผู้ป่วย: <strong>${patientName || 'ไม่ระบุชื่อ'}</strong></p>
                <p style="margin-bottom: 8px;">กรุณากรอกข้อมูลต่อไปนี้:</p>
                <ul style="text-align: left; padding-left: 20px;">
                    ${missing.map(m => `<li style="color: #dc2626;">• ${m}</li>`).join('')}
                </ul>
            `,
            confirmButtonText: 'ไปกรอกข้อมูล',
            confirmButtonColor: '#10B981',
        });
    };

    // Legacy validation (for backward compatibility)
    const isFormValid = () => {
        return (
            form.orRoom &&
            form.scheduledTime &&
            form.hn &&
            form.patientName &&
            form.age &&
            form.department &&
            form.surgeon &&
            form.diagnosis &&
            form.operation &&
            form.ward
        );
    };

    // Add patient to temporary table
    const handleAddPatient = () => {
        if (!isFormValid()) {
            alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
            return;
        }

        // Determine surgery type based on scheduled time
        const surgeryType = getSurgeryType(form.scheduledTime);

        const newPatient: ElectivePatient = {
            id: `temp-${Date.now()}`,
            orRoom: form.orRoom,
            scheduledTime: form.scheduledTime,
            hn: form.hn,
            patientName: form.patientName,
            age: parseInt(form.age),
            department: form.department,
            departmentName: getDepartmentName(form.department),
            surgeon: form.surgeon,
            diagnosis: form.diagnosis,
            operation: form.operation,
            ward: form.ward,
            caseSize: form.caseSize,
            startTime: form.startTime || '',
            endTime: form.endTime || '',
            assist1: form.assist1 || undefined,
            assist2: form.assist2 || undefined,
            scrubNurse: form.scrubNurse || undefined,
            circulate: form.circulate || undefined,
            createdAt: new Date().toISOString(),
            surgeryType: surgeryType, // Add surgery type
        };

        // Add to patients list and sort by scheduled time
        const updatedPatients = [...patients, newPatient].sort((a, b) =>
            a.scheduledTime.localeCompare(b.scheduledTime)
        );

        // Assign queue order based on sorted position
        updatedPatients.forEach((p, index) => {
            (p as any).queueOrder = index + 1;
        });

        setPatients(updatedPatients);

        // Reset form
        setForm({
            orRoom: '',
            scheduledTime: '',
            hn: '',
            patientName: '',
            age: '',
            department: '',
            surgeon: '',
            diagnosis: '',
            operation: '',
            ward: '',
            caseSize: '',
            startTime: '',
            endTime: '',
            assist1: '',
            assist2: '',
            scrubNurse: '',
            circulate: '',
        });
    };

    // Remove patient from temporary table
    const handleRemovePatient = (id: string) => {
        setPatients(patients.filter((p) => p.id !== id));
    };

    // Save all patients to database
    const handleSaveToDatabase = async () => {
        if (patients.length === 0) {
            alert('ไม่มีข้อมูลผู้ป่วยสำหรับบันทึก');
            return;
        }

        // 1. Auto-Routing & Validation
        // Create a copy of patients with auto-assigned OR rooms
        const processedPatients = patients.map(p => ({
            ...p,
            // Pass scheduledTime so that AM/PM doctors are assigned correctly
            orRoom: p.orRoom || getSurgeonORRoom(p.surgeon, new Date(), p.scheduledTime)
        }));

        // Validate processed patients
        for (const patient of processedPatients) {
            // Use relaxed validation (validateForRegistration) instead of complete
            const { valid, missing } = validateForRegistration(patient);
            if (!valid) {
                await showValidationWarning(patient.patientName, missing);
                return; // Stop and let user fill in missing data
            }
        }

        setSaving(true);
        try {
            // Prepare data for API (Use processedPatients which has the assigned rooms)
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const registrations = processedPatients.map((p) => ({
                hn: p.hn,
                patient_name: p.patientName,
                age: p.age || 0,
                surgery_date: today,
                scheduled_time: p.scheduledTime || null,
                surgery_type: p.surgeryType || 'elective',
                or_room: p.orRoom || null,
                department: p.department || null,
                surgeon: p.surgeon || null,
                diagnosis: p.diagnosis || null,
                operation: p.operation || null,
                ward: p.ward || null,
                // case_size must be 'Major' or 'Minor' or null - not empty string
                case_size: (p.caseSize === 'Major' || p.caseSize === 'Minor') ? p.caseSize : null,
                start_time: p.startTime || null,
                end_time: p.endTime || null,
                assist1: p.assist1 || null,
                assist2: p.assist2 || null,
                scrub_nurse: p.scrubNurse || null,
                circulate_nurse: p.circulate || null,
            }));

            const response = await fetch('http://localhost:8000/api/surgery/register/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ registrations }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Handle different error formats from FastAPI
                let errorMessage = 'Failed to save';
                if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                } else if (Array.isArray(errorData.detail)) {
                    // Validation errors from Pydantic
                    errorMessage = errorData.detail.map((e: any) => {
                        const field = e.loc?.slice(-1)[0] || 'field';
                        return `${field}: ${e.msg}`;
                    }).join('\n');
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            const electiveCount = patients.filter((p) => p.surgeryType === 'elective').length;
            const emergencyCount = patients.filter((p) => p.surgeryType === 'emergency').length;

            alert(
                `ส่งข้อมูลเข้าสู่กระดานผ่าตัดเรียบร้อย!\n` +
                `- Elective (ในเวลา): ${electiveCount} ราย\n` +
                `- Emergency (นอกเวลา): ${emergencyCount} ราย`
            );
            setPatients([]);
        } catch (error) {
            console.error('Error saving patients:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล:\n' + (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    // Handle Excel Import
    const handleImportExcel = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                // Skip header row, process data rows
                const importedPatients: ElectivePatient[] = [];
                let skippedRows = 0;

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length < 2) continue; // Skip empty rows

                    // Excel column mapping (ตาม Excel ของผู้ใช้):
                    // row[0]: ความเร่งด่วน (Emergency/Elective)
                    // row[1]: สิ้นผ่าตัดเวลา (เวลา)
                    // row[2]: HN
                    // row[3]: อายุ
                    // row[4]: ชื่อ
                    // row[5]: ชื่อการผ่าตัด (Operation)
                    // row[6]: การวินิจฉัยเบื้องต้น (Diagnosis)
                    // row[7]: แพทย์ผู้สั่ง
                    // row[8]: Ward

                    // Parse surgery type from column A
                    const rawSurgeryType = String(row[0] || '').trim().toLowerCase();
                    let surgeryType: 'elective' | 'emergency' = 'elective';
                    if (rawSurgeryType.includes('emergency') || rawSurgeryType.includes('ฉุกเฉิน')) {
                        surgeryType = 'emergency';
                    }

                    // Parse scheduled time from column B - handle Excel time format
                    let scheduledTime = '';
                    const rawTime = row[1];
                    if (rawTime) {
                        if (typeof rawTime === 'number') {
                            // Excel stores time as fraction of day
                            const totalMinutes = Math.round(rawTime * 24 * 60);
                            const hours = Math.floor(totalMinutes / 60);
                            const minutes = totalMinutes % 60;
                            scheduledTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        } else {
                            // Handle string format like "16:30:00"
                            const timeStr = String(rawTime).trim();
                            const timeParts = timeStr.split(':');
                            if (timeParts.length >= 2) {
                                scheduledTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
                            } else {
                                scheduledTime = timeStr;
                            }
                        }
                    }

                    const hn = String(row[2] || '').trim();
                    const ageRaw = String(row[3] || '').trim();
                    const patientName = String(row[4] || '').trim();
                    const operation = String(row[5] || '').trim();
                    const diagnosis = String(row[6] || '').trim();
                    let surgeon = String(row[7] || '').trim();
                    const ward = String(row[8] || '').trim();

                    // --- Fuzzy Match Surgeon Name ---
                    // Normalize helper: remove all spaces, lowercase
                    const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
                    const target = normalize(surgeon);

                    // Flatten known surgeons list
                    const knownSurgeons = Object.values(SURGEONS).flat();

                    // Try to find exact match (ignoring spaces)
                    const matchedSurgeon = knownSurgeons.find(s => normalize(s) === target);
                    if (matchedSurgeon) {
                        surgeon = matchedSurgeon; // Use the standard name from our system
                    }
                    // --------------------------------

                    // Parse age - extract only years
                    let age = 0;
                    const ageMatch = ageRaw.match(/(\d+)\s*ปี/);
                    if (ageMatch) {
                        age = parseInt(ageMatch[1]);
                    } else {
                        age = parseInt(ageRaw) || 0;
                    }

                    // Skip if essential fields are missing
                    if (!hn || !patientName) {
                        skippedRows++;
                        continue;
                    }

                    const patient: ElectivePatient = {
                        id: `import-${Date.now()}-${i}`,
                        orRoom: '',
                        scheduledTime: scheduledTime,
                        hn: hn.replace(/\D/g, '').padStart(9, '0').slice(0, 9),
                        patientName: patientName,
                        age: age,
                        department: '',
                        departmentName: '',
                        surgeon: surgeon,
                        diagnosis: diagnosis,
                        operation: operation,
                        ward: ward,
                        caseSize: '',
                        startTime: '',
                        endTime: '',
                        assist1: '',
                        assist2: '',
                        scrubNurse: '',
                        circulate: '',
                        createdAt: new Date().toISOString(),
                        surgeryType: surgeryType, // Use type from Excel column A
                    };

                    importedPatients.push(patient);
                }

                if (importedPatients.length > 0) {
                    setPatients([...patients, ...importedPatients]);
                    alert(`✅ นำเข้าสำเร็จ!\n\n` +
                        `📋 นำเข้า: ${importedPatients.length} รายการ\n` +
                        `${skippedRows > 0 ? `⚠️ ข้าม: ${skippedRows} รายการ (ข้อมูลไม่ครบ)\n` : ''}`);
                } else {
                    alert('⚠️ ไม่พบข้อมูลที่สามารถนำเข้าได้\n\nกรุณาตรวจสอบรูปแบบไฟล์ Excel');
                }
            } catch (error) {
                console.error('Excel import error:', error);
                alert('❌ เกิดข้อผิดพลาดในการอ่านไฟล์\n\nกรุณาตรวจสอบรูปแบบไฟล์ Excel');
            }
        };
        input.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        ลงทะเบียนผ่าตัด
                    </h2>
                    <p className="text-slate-500 mt-1">
                        ระบบจะตรวจสอบเวลาอัตโนมัติ: Elective (08:30-16:30) / Emergency (นอกเวลา)
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleImportExcel}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import Excel
                    </button>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        กรอกข้อมูลผู้ป่วย
                    </h3>
                    {form.scheduledTime && <SurgeryTypeBadge time={form.scheduledTime} />}
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* OR Room */}
                    <SimpleSelect
                        label="OR (ห้องผ่าตัด)"
                        value={form.orRoom}
                        onChange={(val) => handleChange('orRoom', val)}
                        options={OR_ROOMS}
                        placeholder="เลือกห้องผ่าตัด"
                        required
                    />

                    {/* Scheduled Time */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            เวลาสั่งผ่าตัด <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            value={form.scheduledTime}
                            onChange={(e) => handleChange('scheduledTime', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            AM = เช้า (00:00-11:59) | PM = บ่าย (12:00-23:59)
                        </p>
                    </div>

                    {/* HN */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            HN <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={9}
                            value={form.hn}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                                handleChange('hn', value);
                            }}
                            onBlur={(e) => {
                                // Check for duplicate patient when user leaves the field
                                checkPatientByHN(e.target.value);
                            }}
                            placeholder="กรอก HN (9 หลัก)"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            ระบบจะตรวจสอบผู้ป่วยซ้ำอัตโนมัติ
                        </p>
                    </div>

                    {/* Patient Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            ชื่อ-สกุล <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.patientName}
                            onChange={(e) => handleChange('patientName', e.target.value)}
                            placeholder="กรอกชื่อ-สกุล"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Age */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            อายุ (ปี) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            value={form.age}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                                handleChange('age', value);
                            }}
                            placeholder="อายุ"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Department */}
                    <SearchableSelect
                        label="แผนก"
                        value={getDepartmentName(form.department)}
                        onChange={handleDepartmentChange}
                        options={DEPARTMENTS.map((d) => d.name)}
                        placeholder="ค้นหาแผนก..."
                        required
                    />

                    {/* Surgeon */}
                    <SearchableSelect
                        label="แพทย์ผู้สั่ง"
                        value={form.surgeon}
                        onChange={(val) => handleChange('surgeon', val)}
                        options={availableSurgeons}
                        placeholder={form.department ? 'ค้นหาแพทย์...' : 'กรุณาเลือกแผนกก่อน'}
                        disabled={!form.department}
                        required
                    />

                    {/* Diagnosis */}
                    <SearchableSelect
                        label="การวินิจฉัยเบื้องต้น (Diagnosis)"
                        value={form.diagnosis}
                        onChange={(val) => handleChange('diagnosis', val)}
                        options={availableDiagnoses}
                        placeholder={form.department ? 'ค้นหา Diagnosis...' : 'กรุณาเลือกแผนกก่อน'}
                        disabled={!form.department}
                        allowCustom
                        required
                    />

                    {/* Operation */}
                    <SearchableSelect
                        label="ชื่อการผ่าตัด (Operation)"
                        value={form.operation}
                        onChange={(val) => handleChange('operation', val)}
                        options={availableOperations}
                        placeholder={form.department ? 'ค้นหา Operation...' : 'กรุณาเลือกแผนกก่อน'}
                        disabled={!form.department}
                        allowCustom
                        required
                    />

                    {/* Ward */}
                    <SearchableSelect
                        label="Ward (หอผู้ป่วย)"
                        value={form.ward}
                        onChange={(val) => handleChange('ward', val)}
                        options={WARDS}
                        placeholder="ค้นหาหอผู้ป่วย..."
                        required
                    />

                    {/* Case Size */}
                    <SimpleSelect
                        label="ขนาดเคส"
                        value={form.caseSize}
                        onChange={(val) => handleChange('caseSize', val)}
                        options={CASE_SIZES}
                        placeholder="เลือกขนาดเคส"
                        required
                    />
                </div>

                {/* Optional Section: Nurse + Time */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-md font-medium text-slate-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        ข้อมูลเพิ่มเติม (ไม่บังคับ)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <TimeInput
                            label="เวลาเริ่มผ่าตัด"
                            value={form.startTime}
                            onChange={(val) => handleChange('startTime', val)}
                            showSeconds
                        />
                        <TimeInput
                            label="เวลาเสร็จผ่าตัด"
                            value={form.endTime}
                            onChange={(val) => handleChange('endTime', val)}
                            showSeconds
                        />
                        <div></div>
                        <SearchableSelect
                            label="Assist 1"
                            value={form.assist1}
                            onChange={(val) => handleChange('assist1', val)}
                            options={NURSES}
                            placeholder="ค้นหาพยาบาล..."
                        />
                        <SearchableSelect
                            label="Assist 2"
                            value={form.assist2}
                            onChange={(val) => handleChange('assist2', val)}
                            options={NURSES}
                            placeholder="ค้นหาพยาบาล..."
                        />
                        <SearchableSelect
                            label="Scrub Nurse"
                            value={form.scrubNurse}
                            onChange={(val) => handleChange('scrubNurse', val)}
                            options={NURSES}
                            placeholder="ค้นหาพยาบาล..."
                        />
                        <SearchableSelect
                            label="Circulate"
                            value={form.circulate}
                            onChange={(val) => handleChange('circulate', val)}
                            options={NURSES}
                            placeholder="ค้นหาพยาบาล..."
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleAddPatient}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        ส่งข้อมูล
                    </button>
                </div>
            </div>

            {/* Temporary Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-400 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        รายชื่อผู้ป่วยที่ลงทะเบียน
                        {patients.length > 0 && (
                            <div className="flex gap-2 ml-2">
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                    Elective: {electiveCount}
                                </span>
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
                                    Emergency: {emergencyCount}
                                </span>
                            </div>
                        )}
                    </h3>

                    {patients.length > 0 && (
                        <button
                            onClick={handleSaveToDatabase}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    ส่งกระดานผ่าตัด
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Table */}
                {patients.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-slate-400 text-lg">ยังไม่มีข้อมูลผู้ป่วย</p>
                        <p className="text-slate-400 text-sm mt-1">กรุณากรอกข้อมูลและกด &quot;ส่งข้อมูล&quot; เพื่อเพิ่มรายชื่อ</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ประเภท</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">เวลา</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">HN</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ชื่อ-สกุล</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">อายุ</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">การวินิจฉัย</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">OPERATION</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">แพทย์ผู้สั่ง</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">WARD</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {patients.map((patient) => {
                                    const surgeryType = (patient as any).surgeryType || 'elective';
                                    return (
                                        <tr key={patient.id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-3 py-3 text-xs">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${surgeryType === 'elective'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                        }`}
                                                >
                                                    {surgeryType === 'elective' ? 'Elective' : 'Emergency'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-xs text-slate-700 font-medium">{patient.scheduledTime || '-'}</td>
                                            <td className="px-3 py-3 text-xs font-medium text-blue-600">{patient.hn}</td>
                                            <td className="px-3 py-3 text-xs text-slate-700">{patient.patientName}</td>
                                            <td className="px-3 py-3 text-xs text-slate-700">{patient.age}</td>
                                            <td className="px-3 py-3 text-xs text-slate-700 max-w-[200px] truncate" title={patient.diagnosis}>{patient.diagnosis || '-'}</td>
                                            <td className="px-3 py-3 text-xs text-slate-700 max-w-[200px] truncate" title={patient.operation}>{patient.operation || '-'}</td>
                                            <td className="px-3 py-3 text-xs text-slate-700 max-w-[150px] truncate" title={patient.surgeon}>{patient.surgeon || '-'}</td>
                                            <td className="px-3 py-3 text-xs text-slate-700">{patient.ward || '-'}</td>
                                            <td className="px-3 py-3 text-center">
                                                <button
                                                    onClick={() => handleRemovePatient(patient.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="ลบ"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
