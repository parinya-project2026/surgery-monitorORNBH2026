'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    getORScheduleForDate,
    ALL_OR_ROOMS,
    getSurgeonORRoom,
} from '@/lib/or-schedule';
import {
    ElectivePatient,
    SURGEONS,
    DIAGNOSES,
    OPERATIONS,
    CASE_SIZES,
    OR_ROOMS,
} from '@/lib/surgery-data';
import Swal from 'sweetalert2';

// Patient not-ready reasons
const NOT_READY_REASONS = [
    'ปฏิเสธผ่าตัด',
    'Lab ไม่พร้อม',
    'รอให้เลือด',
    'NPO ไม่ครบ',
    'BP สูง',
    'BP ต่ำ',
    'Consult ไม่ผ่าน',
    'รอติดต่อญาติ',
    'อื่นๆ', // Added 'Other' option
];

// Format time to Thai style (09:30 → 09.30 น.)
const formatThaiTime = (time: string | null | undefined): string => {
    if (!time) return '-';
    // Convert HH:MM to HH.MM น.
    return time.replace(':', '.') + ' น.';
};

// Mock data for demonstration
const mockElectivePatients: ElectivePatient[] = [];
const mockEmergencyPatients: ElectivePatient[] = [];

import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {
    DEPARTMENTS,
    WARDS,
    NURSES,
    DOCTOR_DEPARTMENT_MAPPING,
    DIAGNOSIS_BY_DEPT,
    OPERATIONS_BY_DEPT,
} from './constants';
import LabAssessmentModal from '@/components/LabAssessmentModal'; // Import Lab Modal

const CASE_SIZES_UPDATED = ['Major', 'Minor']; // Removed Medium

// Helper for React-Select options
const createOption = (label: string) => ({ label, value: label });

// Patient Confirmation Modal
function PatientConfirmationModal({
    patient,
    onClose,
    onConfirm,
}: {
    patient: ElectivePatient & { notReadyReason?: string };
    onClose: () => void;
    onConfirm: (updatedPatient: any) => void;
}) {
    const [form, setForm] = useState({
        orRoom: patient.orRoom || '',
        scheduledTime: patient.scheduledTime || '',
        department: patient.department || '',
        surgeon: patient.surgeon || '',
        diagnosis: patient.diagnosis ? patient.diagnosis.split(',').map(d => d.trim()).filter(Boolean) : [], // Array for multi-select
        operation: patient.operation ? patient.operation.split(',').map(o => o.trim()).filter(Boolean) : [], // Array for multi-select
        ward: patient.ward || '',
        caseSize: patient.caseSize === 'Medium' ? '' : (patient.caseSize || ''), // Clear Medium if present
        startTime: patient.startTime || '',
        endTime: patient.endTime || '',
        assist1: patient.assist1 || '',
        assist2: patient.assist2 || '',
        scrubNurse: patient.scrubNurse || '',
        circulate: patient.circulate || '',
    });
    const [saving, setSaving] = useState(false);

    // Auto-set Department when Surgeon changes
    useEffect(() => {
        if (form.surgeon && DOCTOR_DEPARTMENT_MAPPING[form.surgeon]) {
            // Only auto-set if department is empty or different to avoid overwriting user choice if they manually changed it (optional, but safer to just set it)
            // But requirement says "Auto select", so we enforce it.
            const deptId = DOCTOR_DEPARTMENT_MAPPING[form.surgeon];
            if (form.department !== deptId) {
                setForm(prev => ({ ...prev, department: deptId }));
            }
        }
    }, [form.surgeon, form.department]); // Added form.department to dependency array

    // Derived Options
    const surgeonOptions = useMemo(() => {
        const list = form.department ? (SURGEONS[form.department] || []) : Object.values(SURGEONS).flat();
        // Unique and sorted
        return Array.from(new Set(list)).sort().map(createOption);
    }, [form.department]);

    const diagnosisOptions = useMemo(() => {
        const list = form.department ? (DIAGNOSIS_BY_DEPT[form.department] || []) : [];
        return list.map(createOption);
    }, [form.department]);

    const operationOptions = useMemo(() => {
        const list = form.department ? (OPERATIONS_BY_DEPT[form.department] || []) : [];
        return list.map(createOption);
    }, [form.department]);

    const wardOptions = useMemo(() => WARDS.map(createOption), []);
    const nurseOptions = useMemo(() => NURSES.map(createOption), []);
    const deptOptions = useMemo(() => DEPARTMENTS.map(d => ({ label: d.label, value: d.id })), []);
    const roomOptions = useMemo(() => OR_ROOMS.map(createOption), []);
    const caseSizeOptions = useMemo(() => CASE_SIZES_UPDATED.map(createOption), []);

    const handleChange = (field: string, value: any) => {
        setForm({ ...form, [field]: value });
    };

    const handleConfirm = async () => {
        // Validation
        if (!form.startTime || !form.endTime || !form.assist1 || !form.scrubNurse || !form.circulate) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'warning');
            return;
        }

        setSaving(true);
        try {
            await onConfirm({
                ...patient,
                ...form,
                // Join arrays back to strings for storage
                diagnosis: Array.isArray(form.diagnosis) ? form.diagnosis.join(', ') : form.diagnosis,
                operation: Array.isArray(form.operation) ? form.operation.join(', ') : form.operation,
                status: 'completed',
            });
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'บันทึกข้อมูลไม่สำเร็จ', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Current Values for React Select
    const getVal = (val: string) => val ? createOption(val) : null;
    const getMultiVal = (vals: string[]) => vals.map(createOption);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">📋 ยืนยันข้อมูลผู้ป่วย</h2>
                        <div className="text-blue-100 text-sm">
                            HN: {patient.hn} | {patient.patientName} | {patient.age} ปี
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl" disabled={saving}>&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ห้องผ่าตัด</label>
                            <Select
                                value={getVal(form.orRoom)}
                                onChange={(opt) => handleChange('orRoom', opt?.value || '')}
                                options={roomOptions}
                                placeholder="เลือกห้อง..."
                                isClearable
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">แผนก</label>
                            <Select
                                value={deptOptions.find(d => d.value === form.department)}
                                onChange={(opt) => handleChange('department', opt?.value || '')}
                                options={deptOptions}
                                placeholder="เลือกแผนก..."
                                isClearable
                            />
                        </div>
                    </div>

                    {/* Row 2: Surgeon uses Creatable now too? User asked for Select Search. Creating new surgeon not explicitly asked but good for unmatched imports. Stick to regular Select for now unless requested. */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">แพทย์ผู้สั่ง</label>
                            <CreatableSelect
                                value={getVal(form.surgeon)}
                                onChange={(opt) => handleChange('surgeon', opt?.value || '')}
                                options={surgeonOptions}
                                placeholder="ค้นหาแพทย์..."
                                isClearable
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">การวินิจฉัย (Diagnosis) <span className="text-red-500">*</span></label>
                            <CreatableSelect
                                isMulti
                                value={getMultiVal(form.diagnosis as string[])}
                                onChange={(opts) => handleChange('diagnosis', opts.map(o => o.value))}
                                options={diagnosisOptions}
                                placeholder="เลือก/เพิ่ม Diagnosis..."
                                noOptionsMessage={() => form.department ? "ไม่พบข้อมูล" : "กรุณาเลือกแผนกก่อน"}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">OPERATION <span className="text-red-500">*</span></label>
                            <CreatableSelect
                                isMulti
                                value={getMultiVal(form.operation as string[])}
                                onChange={(opts) => handleChange('operation', opts.map(o => o.value))}
                                options={operationOptions}
                                placeholder="เลือก/เพิ่ม Operation..."
                                noOptionsMessage={() => form.department ? "ไม่พบข้อมูล" : "กรุณาเลือกแผนกก่อน"}
                            />
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ward (หอผู้ป่วย)</label>
                            <Select
                                value={getVal(form.ward)}
                                onChange={(opt) => handleChange('ward', opt?.value || '')}
                                options={wardOptions}
                                placeholder="ค้นหา Ward..."
                                isClearable
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ขนาดเคส</label>
                            <Select
                                value={getVal(form.caseSize)}
                                onChange={(opt) => handleChange('caseSize', opt?.value || '')}
                                options={caseSizeOptions}
                                placeholder="Select Size..."
                                isClearable
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4 pt-4">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">🏥 ข้อมูลการผ่าตัด (จำเป็น)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">เวลาเริ่ม <span className="text-red-500">*</span></label>
                                <input type="time" value={form.startTime} onChange={e => handleChange('startTime', e.target.value)} className="form-input w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">เวลาเสร็จ <span className="text-red-500">*</span></label>
                                <input type="time" value={form.endTime} onChange={e => handleChange('endTime', e.target.value)} className="form-input w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assist 1 <span className="text-red-500">*</span></label>
                                <Select
                                    value={getVal(form.assist1)}
                                    onChange={(opt) => handleChange('assist1', opt?.value || '')}
                                    options={nurseOptions}
                                    placeholder="ค้นหาพยาบาล..."
                                    isClearable
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assist 2</label>
                                <Select
                                    value={getVal(form.assist2)}
                                    onChange={(opt) => handleChange('assist2', opt?.value || '')}
                                    options={nurseOptions}
                                    placeholder="ค้นหาพยาบาล..."
                                    isClearable
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Scrub Nurse <span className="text-red-500">*</span></label>
                                <Select
                                    value={getVal(form.scrubNurse)}
                                    onChange={(opt) => handleChange('scrubNurse', opt?.value || '')}
                                    options={nurseOptions}
                                    placeholder="ค้นหาพยาบาล..."
                                    isClearable
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Circulate <span className="text-red-500">*</span></label>
                                <Select
                                    value={getVal(form.circulate)}
                                    onChange={(opt) => handleChange('circulate', opt?.value || '')}
                                    options={nurseOptions}
                                    placeholder="ค้นหาพยาบาล..."
                                    isClearable
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" disabled={saving}>ยกเลิก</button>
                    <button onClick={handleConfirm} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors flex items-center gap-2" disabled={saving}>
                        {saving ? 'กำลังบันทึก...' : '✅ ยืนยันข้อมูล'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Patient Card Component for Elective Board
function ElectivePatientCard({
    patient,
    index,
    onDragStart,
    onMoveUp,
    onMoveDown,
    onSetNotReady,
    onSetReady,
    onClick,
    onDropOnCard,
    isFirst,
    isLast,
    isGuest = false,
}: {
    patient: ElectivePatient & { notReadyReason?: string; queueOrder?: number; status?: string; npoCompleteTime?: string };
    index: number;
    onDragStart: (e: React.DragEvent, patient: ElectivePatient) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onSetNotReady: (reason: string, npoCompleteTime?: string) => void;
    onSetReady: () => void;
    onClick: () => void;
    onDropOnCard?: (e: React.DragEvent, targetPatientId: string) => void;
    isFirst: boolean;
    isLast: boolean;
    isGuest?: boolean;
}) {
    const [showReasonDropdown, setShowReasonDropdown] = useState(false);
    const [showLabModal, setShowLabModal] = useState(false); // State for Lab Modal
    const [isDragOver, setIsDragOver] = useState(false);
    const [npoCountdown, setNpoCountdown] = useState<string | null>(null);

    // Calculate NPO countdown
    useEffect(() => {
        if (!patient.npoCompleteTime || !patient.notReadyReason?.startsWith('NPO ไม่ครบ')) {
            setNpoCountdown(null);
            return;
        }

        const calculateCountdown = () => {
            const now = new Date();
            const [hours, minutes] = patient.npoCompleteTime!.split(':').map(Number);
            const targetTime = new Date();
            targetTime.setHours(hours, minutes, 0, 0);

            const diffMs = targetTime.getTime() - now.getTime();
            if (diffMs <= 0) {
                setNpoCountdown(null);
                return;
            }

            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const remainMins = diffMins % 60;

            if (diffHours > 0) {
                setNpoCountdown(`${diffHours} ชม. ${remainMins} นาที`);
            } else {
                setNpoCountdown(`${diffMins} นาที`);
            }
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 1000);
        return () => clearInterval(interval);
    }, [patient.npoCompleteTime, patient.notReadyReason]);

    const isNotReady = !!patient.notReadyReason;
    const isCompleted = patient.status === 'completed';

    // Queue Color Logic
    const getQueueColor = (idx: number) => {
        if (idx === 0) return 'bg-yellow-400 text-white shadow-sm ring-1 ring-yellow-300'; // Gold
        if (idx === 1) return 'bg-slate-300 text-slate-700 shadow-sm ring-1 ring-slate-200'; // Silver
        if (idx === 2) return 'bg-orange-300 text-white shadow-sm ring-1 ring-orange-200'; // Bronze
        return 'bg-blue-500 text-white'; // Default
    };

    const isOffCase = patient.notReadyReason?.includes('OFF Case');

    return (
        <div
            draggable={!isOffCase} // Disable drag for OFF Case if desired, or keep enabled. user said "cannot edit", didn't say cannot move. But usually OFF case shouldn't move. Let's disable drag to be safe.
            onDragStart={(e) => !isOffCase && onDragStart(e, patient)}
            onDragOver={(e) => {
                if (isOffCase) return;
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(true);
            }}
            onDragLeave={(e) => {
                if (isOffCase) return;
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
            }}
            onDrop={(e) => {
                if (isOffCase) return;
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
                if (onDropOnCard) {
                    onDropOnCard(e, patient.id);
                }
            }}
            className={`p-3 rounded-xl border transition-all group relative ${isCompleted
                ? 'bg-green-50 border-green-300'
                : isOffCase
                    ? 'bg-slate-200 border-slate-300 grayscale opacity-75' // OFF Case Styling
                    : isNotReady
                        ? 'bg-red-50 border-red-200'
                        : isGuest
                            ? 'bg-purple-50 border-purple-200 hover:shadow-md hover:border-purple-300 cursor-pointer'
                            : 'bg-gradient-to-r from-slate-50 to-white border-slate-100 hover:shadow-md hover:border-blue-200 cursor-pointer'
                } ${isDragOver ? 'border-t-4 border-t-blue-500 pt-2' : ''}`} // Visual cue for insertion
        >
            <div className="flex items-start gap-3">
                {/* Queue Controls */}
                <div className="flex flex-col gap-1 items-center">
                    <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className={`p-1 rounded ${isFirst ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${getQueueColor(index)}`}>
                        {index + 1}
                    </span>
                    <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className={`p-1 rounded ${isLast ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Patient Info - Click to open confirmation modal */}
                <div className="flex-1 min-w-0 cursor-pointer hover:bg-blue-50/50 -m-1 p-1 rounded-lg transition-colors"
                    onClick={() => {
                        if (isNotReady) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'ผู้ป่วยยังไม่พร้อมผ่าตัด',
                                text: `เนื่องจาก ${patient.notReadyReason}`,
                                confirmButtonText: 'รับทราบ',
                                confirmButtonColor: '#3b82f6'
                            });
                        } else {
                            onClick();
                        }
                    }}
                >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {isCompleted && (
                            <span className="text-xs font-medium text-green-700 bg-green-100 border border-green-300 px-2 py-0.5 rounded">
                                ✅ ผ่าตัดเสร็จ
                            </span>
                        )}
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            ⏰ {patient.scheduledTime}
                        </span>
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            HN: {patient.hn}
                        </span>
                        {patient.caseSize && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${patient.caseSize === 'Major' ? 'bg-red-100 text-red-700' :
                                patient.caseSize === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                📏 {patient.caseSize}
                            </span>
                        )}
                        {isNotReady && (
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                                ⚠️ {patient.notReadyReason}
                                {npoCountdown && (
                                    <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-bold animate-pulse">
                                        ⏱️ {npoCountdown}
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                    <p className="font-semibold text-slate-800 truncate">
                        {patient.patientName} <span className="font-normal text-slate-500">({patient.age} ปี)</span>
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                        Dx: {patient.diagnosis}
                    </p>
                    <p className="text-sm text-blue-600 font-medium truncate">
                        {patient.operation}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded truncate max-w-[120px]">
                            👨‍⚕️ {patient.surgeon}
                            {/* Guest Label: Check if surgeon matches room owner or same dep logic if needed */}
                            {/* Ideally, we should check against the room owner. 
                                Since we don't have room owner passed here easily without prop drilling, 
                                and we want to keep it simple: 
                                We'll assume if the card has a prop 'isGuest' passed to it.
                                But for now let's just add a small badge if the patient's surgeon 
                                doesn't match the typical owner of this room?
                                Actually, the best way according to plan is just a visual label "ฝากผ่า".
                                But 'ElectivePatientCard' is generic.
                                
                                Let's check if we can infer 'isGuest' from props.
                                We don't have room info inside the card.
                                
                                Wait, the requirement says: "display Label 'Guest' (ฝากผ่า) when surgeon is not room owner".
                                The card is rendered inside 'ORRoomCard'.
                                We can pass 'roomDoctor' to 'ElectivePatientCard' and compare.
                            */}
                        </span>
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded truncate max-w-[100px]">
                            🏥 {patient.ward}
                        </span>
                    </div>
                    {/* Timing Info */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {patient.startTime && (
                            <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded">
                                ▶️ {formatThaiTime(patient.startTime)}
                            </span>
                        )}
                        {patient.endTime && (
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                                ⏹️ {formatThaiTime(patient.endTime)}
                            </span>
                        )}
                    </div>
                    {/* Nurse Assignments */}
                    <div className="mt-1 space-y-0.5">
                        {patient.assist1 && (
                            <p className="text-xs text-slate-600">💉 Assist1: {patient.assist1}</p>
                        )}
                        {patient.assist2 && (
                            <p className="text-xs text-slate-600">💉 Assist2: {patient.assist2}</p>
                        )}
                        {patient.scrubNurse && (
                            <p className="text-xs text-slate-600">🧤 Scrub: {patient.scrubNurse}</p>
                        )}
                        {patient.circulate && (
                            <p className="text-xs text-slate-600">♻️ Circulate: {patient.circulate}</p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1 shrink-0">
                    {/* Show OFF CASE Label */}
                    {isOffCase && (
                        <div className="text-center mb-1">
                            <span className="text-xs font-bold text-slate-500 border border-slate-400 px-2 py-0.5 rounded bg-white">
                                OFF CASE
                            </span>
                        </div>
                    )}

                    {isNotReady ? (
                        /* Hide Ready button if OFF Case */
                        !isOffCase && (
                            <button
                                onClick={onSetReady}
                                className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                            >
                                ✓ พร้อม
                            </button>
                        )
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowReasonDropdown(!showReasonDropdown)}
                                className="px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 transition-colors"
                            >
                                ⚠️ คลิกเพิ่มเติมเมื่อคนไข้ไม่พร้อมผ่าตัด
                            </button>
                            {/* Backdrop for click outside */}
                            {showReasonDropdown && (
                                <div
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={() => setShowReasonDropdown(false)}
                                />
                            )}
                            {showReasonDropdown && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[200px]">
                                    {NOT_READY_REASONS.map((reason) => (
                                        <button
                                            key={reason}
                                            onClick={async () => {
                                                setShowReasonDropdown(false);
                                                if (reason === 'อื่นๆ') {
                                                    const { value: text } = await Swal.fire({
                                                        input: 'text',
                                                        inputLabel: 'ระบุสาเหตุ',
                                                        inputPlaceholder: 'พิมพ์สาเหตุ...',
                                                        showCancelButton: true,
                                                        confirmButtonText: 'บันทึก',
                                                        cancelButtonText: 'ยกเลิก',
                                                        confirmButtonColor: '#3b82f6',
                                                    });
                                                    if (text) {
                                                        onSetNotReady(text);
                                                    }
                                                } else if (reason === 'Lab ไม่พร้อม') {
                                                    setShowLabModal(true);
                                                } else if (reason === 'ปฏิเสธผ่าตัด') {
                                                    const { isConfirmed, isDenied } = await Swal.fire({
                                                        title: 'ปฏิเสธการผ่าตัด',
                                                        text: 'กรุณาเลือกการดำเนินการ',
                                                        icon: 'question',
                                                        showDenyButton: true,
                                                        showCancelButton: true,
                                                        confirmButtonText: 'OFF Case',
                                                        denyButtonText: 'เลื่อนเวลา',
                                                        cancelButtonText: 'ยกเลิก',
                                                        confirmButtonColor: '#ef4444',
                                                        denyButtonColor: '#f59e0b',
                                                    });

                                                    if (isConfirmed) {
                                                        const { isConfirmed: sure } = await Swal.fire({
                                                            title: 'ยืนยัน OFF Case?',
                                                            text: 'ข้อมูลจะถูกล็อกและไม่สามารถแก้ไขได้อีก',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'ยืนยัน',
                                                            cancelButtonText: 'ยกเลิก',
                                                            confirmButtonColor: '#ef4444',
                                                        });
                                                        if (sure) onSetNotReady('OFF Case: ปฏิเสธผ่าตัด');
                                                    } else if (isDenied) {
                                                        onSetNotReady('เลื่อนเวลา (ปฏิเสธผ่าตัด)');
                                                    }
                                                } else if (reason === 'NPO ไม่ครบ') {
                                                    // Show time picker for NPO complete time
                                                    const { value: npoTime } = await Swal.fire({
                                                        title: '⏰ ระบุเวลาครบ NPO',
                                                        input: 'text',
                                                        inputLabel: 'เวลาที่ครบกำหนด NPO (เช่น 10:30)',
                                                        inputPlaceholder: 'HH:MM',
                                                        inputAttributes: {
                                                            pattern: '[0-9]{2}:[0-9]{2}'
                                                        },
                                                        showCancelButton: true,
                                                        confirmButtonText: 'บันทึก',
                                                        cancelButtonText: 'ยกเลิก',
                                                        confirmButtonColor: '#3b82f6',
                                                        inputValidator: (value) => {
                                                            if (!value) {
                                                                return 'กรุณาระบุเวลา';
                                                            }
                                                            // Validate time format HH:MM
                                                            const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
                                                            if (!timeRegex.test(value)) {
                                                                return 'รูปแบบเวลาไม่ถูกต้อง กรุณาใส่เป็น HH:MM เช่น 10:30';
                                                            }
                                                            return null;
                                                        }
                                                    });
                                                    if (npoTime) {
                                                        // Normalize time format (add leading zero if needed)
                                                        const [h, m] = npoTime.split(':');
                                                        const normalizedTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
                                                        onSetNotReady(`NPO ไม่ครบ (ครบ ${normalizedTime} น.)`, normalizedTime);
                                                    }
                                                } else {
                                                    onSetNotReady(reason);
                                                }
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-700 first:rounded-t-lg last:rounded-b-lg border-b last:border-0 border-slate-100"
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <LabAssessmentModal
                    isOpen={showLabModal}
                    onClose={() => setShowLabModal(false)}
                    onConfirm={(result) => onSetNotReady(result)}
                />
            </div>
        </div>
    );
}

// Emergency Patient Card with OR Selection
function EmergencyPatientCard({
    patient,
    index,
    totalPatients,
    onSetQueue,
    onSelectOR,
    onSetNotReady,
    onSetReady,
    onClick,
}: {
    patient: ElectivePatient & { notReadyReason?: string; selectedOR?: string; queueOrder?: number; npoCompleteTime?: string };
    index: number;
    totalPatients: number;
    onSetQueue: (queueNumber: number) => void;
    onSelectOR: (orRoom: string) => void;
    onSetNotReady: (reason: string, npoCompleteTime?: string) => void;
    onSetReady: () => void;
    onClick: () => void;
}) {
    const [showReasonDropdown, setShowReasonDropdown] = useState(false);
    const [showLabModal, setShowLabModal] = useState(false); // State for Lab Modal
    const [npoCountdown, setNpoCountdown] = useState<string | null>(null);

    // Calculate NPO countdown
    useEffect(() => {
        if (!patient.npoCompleteTime || !patient.notReadyReason?.startsWith('NPO ไม่ครบ')) {
            setNpoCountdown(null);
            return;
        }

        const calculateCountdown = () => {
            const now = new Date();
            const [hours, minutes] = patient.npoCompleteTime!.split(':').map(Number);
            let targetTime = new Date();
            targetTime.setHours(hours, minutes, 0, 0);

            // If target time is in the past, assume it's for tomorrow
            if (targetTime.getTime() < now.getTime()) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            const diffMs = targetTime.getTime() - now.getTime();
            if (diffMs <= 0) {
                setNpoCountdown(null);
                onSetReady(); // Auto set ready when time reached
                return;
            }

            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const remainMins = diffMins % 60;

            if (diffHours > 0) {
                setNpoCountdown(`${diffHours} ชม. ${remainMins} นาที`);
            } else {
                setNpoCountdown(`${diffMins} นาที`);
            }
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 1000);
        return () => clearInterval(interval);
    }, [patient.npoCompleteTime, patient.notReadyReason]);

    const isNotReady = !!patient.notReadyReason;

    return (
        <div className={`p-4 rounded-xl border transition-all ${isNotReady
            ? patient.notReadyReason?.includes('OFF Case')
                ? 'bg-slate-200 border-slate-300 grayscale opacity-75'
                : 'bg-red-50 border-red-200'
            : patient.selectedOR
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-slate-200'
            }`}>
            <div className="flex items-start gap-3">
                {/* Queue Selector */}
                <div className="flex flex-col items-center gap-1">
                    <select
                        value={index + 1}
                        onChange={(e) => onSetQueue(parseInt(e.target.value))}
                        className="w-12 h-8 text-center text-sm font-bold text-white bg-orange-500 rounded border-0 cursor-pointer hover:bg-orange-600 transition-colors appearance-none"
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                    >
                        {Array.from({ length: totalPatients }, (_, i) => (
                            <option key={i + 1} value={i + 1} className="text-slate-800 bg-white">
                                {i + 1}
                            </option>
                        ))}
                    </select>
                    <span className="text-xs text-slate-400">คิว</span>
                </div>

                {/* Patient Info - Click to open confirmation modal */}
                <div className="flex-1 min-w-0 cursor-pointer hover:bg-orange-50/50 -m-1 p-1 rounded-lg transition-colors"
                    onClick={() => {
                        if (isNotReady) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'ผู้ป่วยยังไม่พร้อมผ่าตัด',
                                text: `เนื่องจาก ${patient.notReadyReason}`,
                                confirmButtonText: 'รับทราบ',
                                confirmButtonColor: '#3b82f6'
                            });
                        } else {
                            onClick();
                        }
                    }}
                >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            🚨 Emergency
                        </span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            ⏰ {patient.scheduledTime}
                        </span>
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            HN: {patient.hn}
                        </span>
                        {patient.caseSize && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${patient.caseSize === 'Major' ? 'bg-red-100 text-red-700' :
                                patient.caseSize === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                📏 {patient.caseSize}
                            </span>
                        )}
                        {isNotReady && (
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                                ⚠️ {patient.notReadyReason}
                                {npoCountdown && (
                                    <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-bold animate-pulse">
                                        ⏱️ {npoCountdown}
                                    </span>
                                )}
                            </span>
                        )}
                        {patient.selectedOR && (
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                ✓ {patient.selectedOR}
                            </span>
                        )}
                    </div>
                    {/* Patient Info - Inline layout */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">
                            {patient.patientName}
                        </span>
                        <span className="text-slate-500">({patient.age} ปี)</span>
                        <span className="text-xs text-slate-500">|</span>
                        <span className="text-xs text-slate-600">Dx: {patient.diagnosis}</span>
                        <span className="text-xs text-slate-500">|</span>
                        <span className="text-sm text-blue-600 font-medium">{patient.operation}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                            👨‍⚕️ {patient.surgeon}
                        </span>
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                            🏥 {patient.ward}
                        </span>
                    </div>
                    {/* Timing Info */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {patient.startTime && (
                            <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded">
                                ▶️ {patient.startTime}
                            </span>
                        )}
                        {patient.endTime && (
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                                ⏹️ {patient.endTime}
                            </span>
                        )}
                    </div>
                    {/* Nurse Assignments */}
                    <div className="mt-1 space-y-0.5">
                        {patient.assist1 && (
                            <p className="text-xs text-slate-600">💉 Assist1: {patient.assist1}</p>
                        )}
                        {patient.assist2 && (
                            <p className="text-xs text-slate-600">💉 Assist2: {patient.assist2}</p>
                        )}
                        {patient.scrubNurse && (
                            <p className="text-xs text-slate-600">🧤 Scrub: {patient.scrubNurse}</p>
                        )}
                        {patient.circulate && (
                            <p className="text-xs text-slate-600">♻️ Circulate: {patient.circulate}</p>
                        )}
                    </div>
                </div>

                {/* OR Selection & Action */}
                <div className="flex flex-col gap-2 shrink-0">
                    {/* OR Room Select */}
                    <select
                        value={patient.selectedOR || ''}
                        onChange={(e) => onSelectOR(e.target.value)}
                        className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">เลือกห้องผ่าตัด</option>
                        {ALL_OR_ROOMS.map((or) => (
                            <option key={or} value={or}>{or.replace('ห้องผ่าตัด ', 'OR')}</option>
                        ))}
                    </select>

                    {/* Ready/Not Ready */}
                    {patient.notReadyReason?.includes('OFF Case') && (
                        <div className="text-center mb-1">
                            <span className="text-xs font-bold text-slate-500 border border-slate-400 px-2 py-0.5 rounded bg-white">
                                OFF CASE
                            </span>
                        </div>
                    )}
                    {isNotReady ? (
                        !patient.notReadyReason?.includes('OFF Case') && (
                            <button
                                onClick={onSetReady}
                                className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                            >
                                ✓ พร้อม
                            </button>
                        )
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowReasonDropdown(!showReasonDropdown)}
                                className="w-full px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 transition-colors"
                            >
                                ⚠️ คลิกเพิ่มเติมเมื่อคนไข้ไม่พร้อมผ่าตัด
                            </button>
                            {/* Backdrop for click outside */}
                            {showReasonDropdown && (
                                <div
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={() => setShowReasonDropdown(false)}
                                />
                            )}
                            {showReasonDropdown && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[200px]">
                                    {NOT_READY_REASONS.map((reason) => (
                                        <button
                                            key={reason}
                                            onClick={async () => {
                                                setShowReasonDropdown(false);
                                                if (reason === 'อื่นๆ') {
                                                    const { value: text } = await Swal.fire({
                                                        input: 'text',
                                                        inputLabel: 'ระบุสาเหตุ',
                                                        inputPlaceholder: 'พิมพ์สาเหตุ...',
                                                        showCancelButton: true,
                                                        confirmButtonText: 'บันทึก',
                                                        cancelButtonText: 'ยกเลิก',
                                                        confirmButtonColor: '#3b82f6',
                                                    });
                                                    if (text) {
                                                        onSetNotReady(text);
                                                    }
                                                } else if (reason === 'Lab ไม่พร้อม') {
                                                    setShowLabModal(true);
                                                } else if (reason === 'ปฏิเสธผ่าตัด') {
                                                    const { isConfirmed, isDenied } = await Swal.fire({
                                                        title: 'ปฏิเสธการผ่าตัด',
                                                        text: 'กรุณาเลือกการดำเนินการ',
                                                        icon: 'question',
                                                        showDenyButton: true,
                                                        showCancelButton: true,
                                                        confirmButtonText: 'OFF Case',
                                                        denyButtonText: 'เลื่อนเวลา',
                                                        cancelButtonText: 'ยกเลิก',
                                                        confirmButtonColor: '#ef4444',
                                                        denyButtonColor: '#f59e0b',
                                                    });

                                                    if (isConfirmed) {
                                                        const { isConfirmed: sure } = await Swal.fire({
                                                            title: 'ยืนยัน OFF Case?',
                                                            text: 'ข้อมูลจะถูกล็อกและไม่สามารถแก้ไขได้อีก',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'ยืนยัน',
                                                            cancelButtonText: 'ยกเลิก',
                                                            confirmButtonColor: '#ef4444',
                                                        });
                                                        if (sure) onSetNotReady('OFF Case: ปฏิเสธผ่าตัด');
                                                    } else if (isDenied) {
                                                        onSetNotReady('เลื่อนเวลา (ปฏิเสธผ่าตัด)');
                                                    }
                                                } else if (reason === 'NPO ไม่ครบ') {
                                                    // Show time picker for NPO complete time
                                                    const { value: npoTime } = await Swal.fire({
                                                        title: '⏰ ระบุเวลาครบ NPO',
                                                        html: '<div class="text-sm text-slate-500 mb-4 text-left bg-slate-50 p-3 rounded-lg border border-slate-200">' +
                                                            '<p class="font-semibold mb-1">คำแนะนำ:</p>' +
                                                            '<ul class="list-disc list-inside space-y-1">' +
                                                            '<li><b>AM</b> = เที่ยงคืน - 11:59 (เช้า)</li>' +
                                                            '<li><b>PM</b> = เที่ยงวัน - 23:59 (บ่าย/ค่ำ)</li>' +
                                                            '</ul>' +
                                                            '</div>',
                                                        input: 'time',
                                                        inputLabel: 'เลือกเวลาที่ครบกำหนด',
                                                        showCancelButton: true,
                                                        confirmButtonText: 'บันทึก',
                                                        cancelButtonText: 'ยกเลิก',
                                                        confirmButtonColor: '#3b82f6',
                                                        inputValidator: (value) => {
                                                            if (!value) {
                                                                return 'กรุณาระบุเวลา';
                                                            }
                                                            return null;
                                                        }
                                                    });
                                                    if (npoTime) {
                                                        // Normalize time format (add leading zero if needed)
                                                        const [h, m] = npoTime.split(':');
                                                        const normalizedTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
                                                        onSetNotReady(`NPO ไม่ครบ (ครบ ${normalizedTime} น.)`, normalizedTime);
                                                    }
                                                } else {
                                                    onSetNotReady(reason);
                                                }
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-700 first:rounded-t-lg last:rounded-b-lg border-b last:border-0 border-slate-100"
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <LabAssessmentModal
                    isOpen={showLabModal}
                    onClose={() => setShowLabModal(false)}
                    onConfirm={(result) => onSetNotReady(result)}
                />
            </div>
        </div>
    );
}

// OR Room Card for Elective Board
function ORRoomCard({
    orRoom,
    doctorInfo,
    patients,
    isCollapsed,
    onToggle,
    onDragOver,
    onDrop,
    onMovePatient,
    onSetPatientNotReady,
    onSetPatientReady,
    onPatientClick,
    onInsertDrop,
}: {
    orRoom: string;
    doctorInfo: { doctor: string; period: string } | null;
    patients: (ElectivePatient & { notReadyReason?: string; status?: string; npoCompleteTime?: string })[];
    isCollapsed: boolean;
    onToggle: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, targetOrRoom: string) => void;
    onMovePatient: (patientId: string, direction: 'up' | 'down') => void;
    onSetPatientNotReady: (patientId: string, reason: string, npoCompleteTime?: string) => void;
    onSetPatientReady: (patientId: string) => void;
    onPatientClick: (patient: ElectivePatient & { notReadyReason?: string; npoCompleteTime?: string }) => void;
    onInsertDrop?: (e: React.DragEvent, targetPatientId: string) => void;
}) {
    const isClosed = doctorInfo?.doctor === 'ปิดห้อง';
    const roomNumber = orRoom.replace('ห้องผ่าตัด ', 'OR');

    return (
        <div
            className={`rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 ${isClosed ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-100'
                }`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, orRoom)}
        >
            {/* Header */}
            <div
                className={`px-4 py-3 flex items-center justify-between cursor-pointer ${isClosed ? 'bg-slate-200' : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                    }`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${isClosed ? 'text-slate-500' : 'text-white'}`}>
                        {roomNumber}
                    </span>
                    {!isClosed && doctorInfo && (
                        <span className="px-2 py-1 bg-white/20 rounded-lg text-white text-sm">
                            {doctorInfo.period === 'ALLDAY' ? 'ทั้งวัน' : doctorInfo.period === 'AM' ? 'เช้า' : 'บ่าย'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isClosed && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                            {patients.length} ราย
                        </span>
                    )}
                    <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''} ${isClosed ? 'text-slate-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Doctor Info */}
            {!isCollapsed && (
                <div className={`px-4 py-2 border-b ${isClosed ? 'bg-slate-100 border-slate-200' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex items-center gap-2">
                        <svg className={`w-5 h-5 ${isClosed ? 'text-slate-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className={`font-medium ${isClosed ? 'text-slate-500' : 'text-blue-700'}`}>
                            {doctorInfo?.doctor || 'ไม่ระบุ'}
                        </span>
                    </div>
                </div>
            )}

            {/* Patient List */}
            {!isCollapsed && !isClosed && (
                <div className="p-3 min-h-[100px]">
                    {patients.length === 0 ? (
                        <div className="text-center py-6 text-slate-400">
                            <p className="text-sm">ยังไม่มีผู้ป่วย</p>
                            <p className="text-xs mt-1">ลากผู้ป่วยมาวางที่นี่</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {patients.map((patient, idx) => (
                                <ElectivePatientCard
                                    key={patient.id}
                                    patient={patient}
                                    index={idx}
                                    onDragStart={(e, patient) => {
                                        e.dataTransfer.setData('patientId', patient.id);
                                    }}
                                    onMoveUp={() => onMovePatient(patient.id, 'up')}
                                    onMoveDown={() => onMovePatient(patient.id, 'down')}
                                    onSetNotReady={(reason, npoTime) => onSetPatientNotReady(patient.id, reason, npoTime)}
                                    onSetReady={() => onSetPatientReady(patient.id)}
                                    onClick={() => onPatientClick(patient)}
                                    isFirst={idx === 0}
                                    isLast={idx === patients.length - 1}
                                    onDropOnCard={onInsertDrop}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SurgeryBoardPage() {
    // Active tab: 'elective' | 'emergency'
    const [activeTab, setActiveTab] = useState<'elective' | 'emergency'>('elective');

    // Selected date - initialize as null to avoid hydration mismatch
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Loading state
    const [loading, setLoading] = useState(false);

    // Initialize date on client side
    useEffect(() => {
        setSelectedDate(new Date());
    }, []);



    // Elective patients
    const [electivePatients, setElectivePatients] = useState<(ElectivePatient & { notReadyReason?: string; npoCompleteTime?: string })[]>([]);

    // Emergency patients
    const [emergencyPatients, setEmergencyPatients] = useState<(ElectivePatient & { notReadyReason?: string; selectedOR?: string; npoCompleteTime?: string })[]>([]);

    // Collapsed OR rooms
    const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({});

    // Selected patient for confirmation modal
    const [selectedPatient, setSelectedPatient] = useState<(ElectivePatient & { notReadyReason?: string; npoCompleteTime?: string }) | null>(null);

    // Counter for re-rendering NPO countdown every second
    const [npoTick, setNpoTick] = useState(0);

    // Selected emergency patient for confirmation modal
    const [selectedEmergencyPatient, setSelectedEmergencyPatient] = useState<(ElectivePatient & { notReadyReason?: string; selectedOR?: string; npoCompleteTime?: string }) | null>(null);

    // Collapsed surgeon groups for Emergency view
    const [collapsedSurgeons, setCollapsedSurgeons] = useState<Record<string, boolean>>({});

    // Fetch patients from API when date changes
    useEffect(() => {
        if (!selectedDate) return;

        const fetchPatients = async () => {
            setLoading(true);
            try {
                // Use local date instead of UTC
                const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

                // Fetch elective patients
                const electiveRes = await fetch(`http://localhost:8000/api/surgery/elective/${dateStr}`);
                if (electiveRes.ok) {
                    const electiveData = await electiveRes.json();
                    const mappedElective = electiveData.map((s: any) => ({
                        id: String(s.id),
                        orRoom: s.or_room || '',
                        scheduledTime: s.scheduled_time || '',
                        hn: s.hn,
                        patientName: s.patient_name,
                        age: s.age || 0,
                        department: s.department || '',
                        departmentName: s.department || '',
                        surgeon: s.surgeon || '',
                        diagnosis: s.diagnosis || '',
                        operation: s.operation || '',
                        ward: s.ward || '',
                        caseSize: s.case_size || '',
                        startTime: s.start_time || '',
                        endTime: s.end_time || '',
                        assist1: s.assist1 || '',
                        assist2: s.assist2 || '',
                        scrubNurse: s.scrub_nurse || '',
                        circulate: s.circulate_nurse || '',
                        createdAt: s.created_at || '',
                        notReadyReason: undefined,
                        npoCompleteTime: undefined,
                    }));
                    setElectivePatients(mappedElective);
                }

                // Fetch emergency patients
                const emergencyRes = await fetch(`http://localhost:8000/api/surgery/emergency/${dateStr}`);
                if (emergencyRes.ok) {
                    const emergencyData = await emergencyRes.json();
                    const mappedEmergency = emergencyData.map((s: any) => ({
                        id: String(s.id),
                        orRoom: s.or_room || '',
                        scheduledTime: s.scheduled_time || '',
                        hn: s.hn,
                        patientName: s.patient_name,
                        age: s.age || 0,
                        department: s.department || '',
                        departmentName: s.department || '',
                        surgeon: s.surgeon || '',
                        diagnosis: s.diagnosis || '',
                        operation: s.operation || '',
                        ward: s.ward || '',
                        caseSize: s.case_size || '',
                        startTime: s.start_time || '',
                        endTime: s.end_time || '',
                        assist1: s.assist1 || '',
                        assist2: s.assist2 || '',
                        scrubNurse: s.scrub_nurse || '',
                        circulate: s.circulate_nurse || '',
                        createdAt: s.created_at || '',
                        notReadyReason: undefined,
                        selectedOR: s.or_room || '',
                        npoCompleteTime: undefined,
                    }));
                    setEmergencyPatients(mappedEmergency);
                }
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [selectedDate]);

    // NPO Auto-ready timer: Check every second and auto-set ready when NPO time is reached
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            // Check elective patients
            setElectivePatients(prev => {
                let hasChanges = false;
                const updated = prev.map(p => {
                    if (p.notReadyReason?.startsWith('NPO ไม่ครบ') && p.npoCompleteTime) {
                        if (currentTimeStr >= p.npoCompleteTime) {
                            hasChanges = true;
                            return { ...p, notReadyReason: undefined, npoCompleteTime: undefined };
                        }
                    }
                    return p;
                });
                return hasChanges ? updated : prev;
            });

            // Check emergency patients
            setEmergencyPatients(prev => {
                let hasChanges = false;
                const updated = prev.map(p => {
                    if (p.notReadyReason?.startsWith('NPO ไม่ครบ') && p.npoCompleteTime) {
                        if (currentTimeStr >= p.npoCompleteTime) {
                            hasChanges = true;
                            return { ...p, notReadyReason: undefined, npoCompleteTime: undefined };
                        }
                    }
                    return p;
                });
                return hasChanges ? updated : prev;
            });

            // Update tick for countdown re-render
            setNpoTick(t => t + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Handle patient confirmation (update to completed)
    const handleConfirmPatient = async (updatedPatient: any) => {
        try {
            const response = await fetch(`/api/surgery/${updatedPatient.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    or_room: updatedPatient.orRoom,
                    scheduled_time: updatedPatient.scheduledTime,
                    department: updatedPatient.department,
                    surgeon: updatedPatient.surgeon,
                    diagnosis: updatedPatient.diagnosis,
                    operation: updatedPatient.operation,
                    ward: updatedPatient.ward,
                    case_size: updatedPatient.caseSize || null,
                    start_time: updatedPatient.startTime,
                    end_time: updatedPatient.endTime,
                    assist1: updatedPatient.assist1,
                    assist2: updatedPatient.assist2 || null,
                    scrub_nurse: updatedPatient.scrubNurse,
                    circulate_nurse: updatedPatient.circulate,
                    status: 'completed',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to update patient');
            }

            // Update local state
            setElectivePatients(prev => prev.map(p =>
                p.id === updatedPatient.id
                    ? { ...p, ...updatedPatient, status: 'completed' }
                    : p
            ));

            await Swal.fire('สำเร็จ!', 'บันทึกข้อมูลและยืนยันการผ่าตัดเรียบร้อยแล้ว', 'success');
        } catch (error) {
            console.error('Error confirming patient:', error);
            throw error;
        }
    };

    // Handle emergency patient confirmation (update to completed)
    const handleConfirmEmergencyPatient = async (updatedPatient: any) => {
        try {
            const response = await fetch(`/api/surgery/${updatedPatient.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    or_room: updatedPatient.orRoom,
                    scheduled_time: updatedPatient.scheduledTime,
                    department: updatedPatient.department,
                    surgeon: updatedPatient.surgeon,
                    diagnosis: updatedPatient.diagnosis,
                    operation: updatedPatient.operation,
                    ward: updatedPatient.ward,
                    case_size: updatedPatient.caseSize || null,
                    start_time: updatedPatient.startTime,
                    end_time: updatedPatient.endTime,
                    assist1: updatedPatient.assist1,
                    assist2: updatedPatient.assist2 || null,
                    scrub_nurse: updatedPatient.scrubNurse,
                    circulate_nurse: updatedPatient.circulate,
                    status: 'completed',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to update patient');
            }

            // Update local state
            setEmergencyPatients(prev => prev.map(p =>
                p.id === updatedPatient.id
                    ? { ...p, ...updatedPatient, status: 'completed' }
                    : p
            ));

            await Swal.fire('สำเร็จ!', 'บันทึกข้อมูลและยืนยันการผ่าตัด Emergency เรียบร้อยแล้ว', 'success');
        } catch (error) {
            console.error('Error confirming emergency patient:', error);
            throw error;
        }
    };

    // OR Schedule
    const orSchedule = useMemo(() => selectedDate ? getORScheduleForDate(selectedDate) : null, [selectedDate]);

    // Fetch patients from API when date changes
    useEffect(() => {
        if (!selectedDate) return;

        const fetchPatients = async () => {
            setLoading(true);
            try {
                // Fix Timezone Issue: Use local date instead of UTC
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                // Fetch elective patients
                const electiveRes = await fetch(`/api/surgery/elective/${dateStr}`);
                if (electiveRes.ok) {
                    const data = await electiveRes.json();
                    setElectivePatients(data.map((p: any) => {
                        // Auto-assign OR room if not set, based on surgeon and scheduled time
                        let orRoom = p.or_room || '';
                        if (!orRoom && p.surgeon) {
                            orRoom = getSurgeonORRoom(p.surgeon, selectedDate, p.scheduled_time || '');
                        }
                        return {
                            id: p.id.toString(),
                            orRoom: orRoom,
                            scheduledTime: p.scheduled_time,
                            hn: p.hn,
                            patientName: p.patient_name,
                            age: p.age,
                            department: p.department,
                            departmentName: p.department,
                            surgeon: p.surgeon,
                            diagnosis: p.diagnosis,
                            operation: p.operation,
                            ward: p.ward,
                            caseSize: p.case_size,
                            startTime: p.start_time || '',
                            endTime: p.end_time || '',
                            status: p.status,
                            notReadyReason: p.not_ready_reason,
                            surgeryType: 'elective',
                        };
                    }));
                }

                // Fetch emergency patients
                const emergencyRes = await fetch(`/api/surgery/emergency/${dateStr}`);
                if (emergencyRes.ok) {
                    const data = await emergencyRes.json();
                    setEmergencyPatients(data.map((p: any) => ({
                        id: p.id.toString(),
                        orRoom: p.or_room,
                        scheduledTime: p.scheduled_time,
                        hn: p.hn,
                        patientName: p.patient_name,
                        age: p.age,
                        department: p.department,
                        departmentName: p.department,
                        surgeon: p.surgeon,
                        diagnosis: p.diagnosis,
                        operation: p.operation,
                        ward: p.ward,
                        caseSize: p.case_size,
                        startTime: p.start_time || '',
                        endTime: p.end_time || '',
                        status: p.status,
                        notReadyReason: p.not_ready_reason,
                        selectedOR: p.selected_or,
                        surgeryType: 'emergency',
                    })));
                }
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [selectedDate]);

    // Group elective patients by OR room
    const patientsByOR = useMemo(() => {
        const grouped: Record<string, (ElectivePatient & { notReadyReason?: string })[]> = {};
        ALL_OR_ROOMS.forEach((or) => {
            grouped[or] = electivePatients
                .filter((p) => p.orRoom === or)
                .filter((p) => p.orRoom === or);
            // .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || '')); // Remove auto-sort to allow manual reordering
        });
        return grouped;
    }, [electivePatients]);

    // Patients waiting for room assignment (no valid OR room)
    const unassignedPatients = useMemo(() => {
        return electivePatients.filter((p) =>
            !p.orRoom || p.orRoom === 'ห้องพิเศษ' || !ALL_OR_ROOMS.includes(p.orRoom)
        ).sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
    }, [electivePatients]);


    // Handlers
    const handleToggleCollapse = (orRoom: string) => {
        setCollapsedRooms((prev) => ({ ...prev, [orRoom]: !prev[orRoom] }));
    };

    const handleToggleSurgeonCollapse = (surgeon: string) => {
        setCollapsedSurgeons((prev) => ({ ...prev, [surgeon]: !prev[surgeon] }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, targetOrRoom: string) => {
        e.preventDefault();
        const patientId = e.dataTransfer.getData('patientId');
        if (!patientId) return;

        // Find patient
        const patient = electivePatients.find(p => p.id === patientId);
        if (!patient) return;

        // --- Alert Logic: Check Cross-Group Move ---
        if (targetOrRoom && orSchedule) {
            const roomOwner = orSchedule[targetOrRoom]?.doctor;

            // If room has an owner (and not closed), check mismatch
            if (roomOwner && roomOwner !== 'ปิดห้อง') {
                const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
                const isMatch = normalize(patient.surgeon || '').includes(normalize(roomOwner)) ||
                    normalize(roomOwner).includes(normalize(patient.surgeon || ''));

                if (!isMatch) {
                    const result = await Swal.fire({
                        title: 'ยืนยันการย้ายข้ามห้อง?',
                        text: `คุณต้องการที่จะย้ายเคสไปห้องของ "${roomOwner}" ใช่หรือไม่?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'ใช่, ย้ายเลย',
                        cancelButtonText: 'ยกเลิก',
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                    });

                    if (!result.isConfirmed) return; // Cancel move
                }
            }
        }
        // -------------------------------------------

        // Optimistic Update: Move to end of target room
        setElectivePatients(prev => {
            const patient = prev.find(p => p.id === patientId);
            if (!patient) return prev;
            return prev.map(p => p.id === patientId ? { ...p, orRoom: targetOrRoom } : p);
        });

        // Sync API
        updatePatientRoom(patientId, targetOrRoom);
    };

    // Handle Drop to Insert (Sortable)
    const handleInsertDrop = async (e: React.DragEvent, targetPatientId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('patientId');
        if (!draggedId || draggedId === targetPatientId) return;

        // Find dragged patient for check
        const draggedPatient = electivePatients.find(p => p.id === draggedId);
        const targetPatient = electivePatients.find(p => p.id === targetPatientId);

        if (!draggedPatient || !targetPatient) return;
        const targetRoom = targetPatient.orRoom;

        // --- Alert Logic (Duplicate for Insert) ---
        if (targetRoom && orSchedule && draggedPatient.orRoom !== targetRoom) {
            const roomOwner = orSchedule[targetRoom]?.doctor;
            if (roomOwner && roomOwner !== 'ปิดห้อง') {
                const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
                const isMatch = normalize(draggedPatient.surgeon || '').includes(normalize(roomOwner)) ||
                    normalize(roomOwner).includes(normalize(draggedPatient.surgeon || ''));

                if (!isMatch) {
                    const result = await Swal.fire({
                        title: 'ยืนยันการย้ายข้ามห้อง?',
                        text: `คุณต้องการที่จะย้ายเคสไปห้องของ "${roomOwner}" ใช่หรือไม่?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'ใช่, ย้ายเลย',
                        cancelButtonText: 'ยกเลิก',
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                    });
                    if (!result.isConfirmed) return;
                }
            }
        }
        // ------------------------------------------

        setElectivePatients(prev => {
            const draggedIndex = prev.findIndex(p => p.id === draggedId);
            const targetIndex = prev.findIndex(p => p.id === targetPatientId);

            if (draggedIndex === -1 || targetIndex === -1) return prev;

            const newList = [...prev];
            const [draggedItem] = newList.splice(draggedIndex, 1);

            // Re-find target index in the new list (safe way)
            const newTargetIndex = newList.findIndex(p => p.id === targetPatientId);

            // Insert before target
            newList.splice(newTargetIndex, 0, draggedItem);

            // Ensure room is updated to match target (if dragging cross-room)
            if (targetRoom && draggedItem.orRoom !== targetRoom) {
                draggedItem.orRoom = targetRoom;
                updatePatientRoom(draggedId, targetRoom);
            }

            return newList;
        });
    };

    const updatePatientRoom = async (patientId: string, orRoom: string) => {
        const patient = electivePatients.find(p => p.id === patientId);
        if (!patient) return;
        try {
            await fetch(`/api/surgery/${patientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    or_room: orRoom,
                    scheduled_time: patient.scheduledTime,
                    department: patient.department,
                    surgeon: patient.surgeon,
                    patient_name: patient.patientName,
                    hn: patient.hn,
                    operation: patient.operation,
                    diagnosis: patient.diagnosis,
                    ward: patient.ward
                }),
            });
        } catch (error) {
            console.error('Failed to update room:', error);
        }
    };

    const handleMovePatient = (patientId: string, direction: 'up' | 'down') => {
        setElectivePatients((prev) => {
            const patient = prev.find(p => p.id === patientId);
            if (!patient) return prev;

            // Get patients in THIS room to find the correct neighbor to swap with
            const roomPatients = prev.filter(p => p.orRoom === patient.orRoom);
            const indexInRoom = roomPatients.findIndex(p => p.id === patientId);

            if (indexInRoom === -1) return prev;

            const targetIndexInRoom = direction === 'up' ? indexInRoom - 1 : indexInRoom + 1;
            if (targetIndexInRoom < 0 || targetIndexInRoom >= roomPatients.length) return prev;

            const targetPatient = roomPatients[targetIndexInRoom];

            // Find real indices in global list
            const idx1 = prev.findIndex(p => p.id === patientId);
            const idx2 = prev.findIndex(p => p.id === targetPatient.id);

            if (idx1 === -1 || idx2 === -1) return prev;

            // Swap in global list
            const newList = [...prev];
            [newList[idx1], newList[idx2]] = [newList[idx2], newList[idx1]];
            return newList;
        });
    };

    const handleSetPatientNotReady = (patientId: string, reason: string, npoCompleteTime?: string) => {
        setElectivePatients((prev) =>
            prev.map((p) => (p.id === patientId ? { ...p, notReadyReason: reason, npoCompleteTime } : p))
        );
    };

    const handleSetPatientReady = (patientId: string) => {
        setElectivePatients((prev) =>
            prev.map((p) => (p.id === patientId ? { ...p, notReadyReason: undefined, npoCompleteTime: undefined } : p))
        );
    };

    // Emergency handlers
    const handleEmergencyMovePatient = (patientId: string, direction: 'up' | 'down') => {
        setEmergencyPatients((prev) => {
            const idx = prev.findIndex((p) => p.id === patientId);
            if (idx === -1) return prev;
            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= prev.length) return prev;
            const newList = [...prev];
            [newList[idx], newList[newIdx]] = [newList[newIdx], newList[idx]];
            return newList;
        });
    };

    // Set emergency patient queue position directly
    const handleEmergencySetQueue = (patientId: string, newQueuePosition: number) => {
        setEmergencyPatients((prev) => {
            const currentIndex = prev.findIndex((p) => p.id === patientId);
            if (currentIndex === -1) return prev;

            // Convert 1-based queue position to 0-based index
            const targetIndex = newQueuePosition - 1;
            if (targetIndex < 0 || targetIndex >= prev.length || targetIndex === currentIndex) return prev;

            // Remove patient from current position
            const newList = [...prev];
            const [movedPatient] = newList.splice(currentIndex, 1);

            // Insert at new position
            newList.splice(targetIndex, 0, movedPatient);

            return newList;
        });
    };

    const handleEmergencySelectOR = (patientId: string, orRoom: string) => {
        setEmergencyPatients((prev) =>
            prev.map((p) => (p.id === patientId ? { ...p, selectedOR: orRoom } : p))
        );
    };

    const handleEmergencySetNotReady = (patientId: string, reason: string, npoCompleteTime?: string) => {
        setEmergencyPatients((prev) =>
            prev.map((p) => (p.id === patientId ? { ...p, notReadyReason: reason, npoCompleteTime } : p))
        );
    };

    const handleEmergencySetReady = (patientId: string) => {
        setEmergencyPatients((prev) =>
            prev.map((p) => (p.id === patientId ? { ...p, notReadyReason: undefined, npoCompleteTime: undefined } : p))
        );
    };

    // Format date
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('th-TH', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    // Reset Data
    const handleResetData = async () => {
        const result = await Swal.fire({
            title: 'ยืนยันล้างข้อมูล?',
            text: "ข้อมูลการผ่าตัดทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้! (สำหรับ Test System)",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบทั้งหมด',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:8000/api/surgery/reset/all', {
                    method: 'DELETE',
                });

                if (res.ok) {
                    await Swal.fire(
                        'ลบข้อมูลสำเร็จ!',
                        'ข้อมูลสําหรับทดสอบถูกล้างเรียบร้อยแล้ว',
                        'success'
                    );
                    // Reload data by resetting state
                    setElectivePatients([]);
                    setEmergencyPatients([]);
                    // Trigger refetch by updating selectedDate
                    setSelectedDate(new Date(selectedDate!));
                } else {
                    throw new Error('Failed to reset data');
                }
            } catch (error) {
                console.error('Error resetting data:', error);
                await Swal.fire(
                    'เกิดข้อผิดพลาด!',
                    'ไม่สามารถล้างข้อมูลได้',
                    'error'
                );
            } finally {
                setLoading(false);
            }
        }
    };

    const getDayName = (date: Date) => {
        const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        return days[date.getDay()];
    };

    // Loading state
    if (!selectedDate) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">กระดานผ่าตัด</h2>
                    <p className="text-slate-500 mt-1">{formatDate(selectedDate)}</p>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const prev = new Date(selectedDate);
                            prev.setDate(prev.getDate() - 1);
                            setSelectedDate(prev);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <input
                        type="date"
                        value={(() => {
                            if (!selectedDate) return '';
                            const year = selectedDate.getFullYear();
                            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                            const day = String(selectedDate.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        })()}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="px-4 py-2 border border-slate-200 rounded-xl"
                    />
                    <button
                        onClick={() => {
                            const next = new Date(selectedDate);
                            next.setDate(next.getDate() + 1);
                            setSelectedDate(next);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setSelectedDate(new Date())}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                    >
                        วันนี้
                    </button>

                    {/* Reset Button */}
                    <button
                        onClick={handleResetData}
                        className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 hover:shadow transition-all flex items-center gap-1"
                        title="ลบข้อมูลทดสอบทั้งหมด"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden xl:inline text-sm font-medium">ล้างกระดาน</span>
                    </button>
                </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('elective')}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${activeTab === 'elective'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <span>📋</span>
                        <span>กระดาน Elective</span>
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                            {electivePatients.length}
                        </span>
                    </div>
                    <p className="text-xs opacity-75 mt-1">08:30 - 16:30 น. | ตามแพทย์ประจำห้อง</p>
                </button>
                <button
                    onClick={() => setActiveTab('emergency')}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${activeTab === 'emergency'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <span>🚨</span>
                        <span>กระดาน Emergency</span>
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                            {emergencyPatients.length}
                        </span>
                    </div>
                    <p className="text-xs opacity-75 mt-1">16:30 - 08:30 น. | เลือกห้องได้อิสระ</p>
                </button>
            </div>

            {/* Elective Board */}
            {activeTab === 'elective' && (
                <div className="space-y-4">
                    {/* Unassigned Patients Panel */}
                    <div
                        className="bg-amber-50 rounded-2xl shadow-lg border border-amber-200 overflow-hidden mb-6 transition-all"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, '')}
                    >
                        <div className="bg-amber-400 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🚦</span>
                                <span className="font-bold text-white">รอจัดสรรห้อง</span>
                                <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-sm">
                                    {unassignedPatients.length} ราย
                                </span>
                            </div>
                            <p className="text-white/90 text-sm">ลากผู้ป่วยกลับมาวางที่นี่เพื่อรอยืนยัน</p>
                        </div>

                        {unassignedPatients.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-amber-200 rounded-xl m-4 bg-white/50">
                                <span className="text-4xl block mb-2">📥</span>
                                <p className="text-amber-600 font-medium">พื้นที่ว่าง (Unassigned)</p>
                                <p className="text-amber-400 text-sm">ลากผู้ป่วยมาวางที่นี่เพื่อยกเลิกห้อง</p>
                            </div>
                        ) : (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {unassignedPatients.map((patient, idx) => (
                                    <div
                                        key={patient.id}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData('patientId', patient.id)}
                                        className="bg-white p-3 rounded-xl border border-amber-200 cursor-move hover:shadow-md transition-all"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                        HN: {patient.hn}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-slate-800 truncate">
                                                    {patient.patientName} <span className="font-normal text-slate-500">({patient.age} ปี)</span>
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    Dx: {patient.diagnosis}
                                                </p>
                                                <p className="text-sm text-blue-600 font-medium truncate">
                                                    {patient.operation}
                                                </p>
                                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                                                    👨‍⚕️ {patient.surgeon}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedPatient(patient)}
                                                className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 bg-blue-50 rounded"
                                            >
                                                แก้ไข
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* OR Room Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ALL_OR_ROOMS.map((orRoom) => (
                            <ORRoomCard
                                key={orRoom}
                                orRoom={orRoom}
                                doctorInfo={orSchedule?.[orRoom] || null}
                                patients={patientsByOR[orRoom] || []}
                                isCollapsed={collapsedRooms[orRoom] || false}
                                onToggle={() => handleToggleCollapse(orRoom)}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onMovePatient={handleMovePatient}
                                onSetPatientNotReady={handleSetPatientNotReady}
                                onSetPatientReady={handleSetPatientReady}
                                onPatientClick={(patient) => setSelectedPatient(patient)}
                                onInsertDrop={handleInsertDrop}
                            />
                        ))}
                    </div>
                </div>
            )}


            {/* Emergency Board */}
            {activeTab === 'emergency' && (() => {
                // Group patients by surgeon
                const patientsBySurgeon = emergencyPatients.reduce((acc, patient) => {
                    const surgeon = patient.surgeon || 'ไม่ระบุแพทย์';
                    if (!acc[surgeon]) {
                        acc[surgeon] = [];
                    }
                    acc[surgeon].push(patient);
                    return acc;
                }, {} as Record<string, typeof emergencyPatients>);

                const surgeonNames = Object.keys(patientsBySurgeon).sort();

                return (
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <span className="text-2xl">🚨</span>
                                คิวผ่าตัดนอกเวลา (Emergency)
                            </h3>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-500">
                                    รวม {emergencyPatients.length} ราย | {surgeonNames.length} แพทย์
                                </span>
                            </div>
                        </div>

                        {emergencyPatients.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <span className="text-4xl">📭</span>
                                <p className="mt-2">ยังไม่มีผู้ป่วย Emergency</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {surgeonNames.map((surgeon) => {
                                    const patients = patientsBySurgeon[surgeon];
                                    const isCollapsed = collapsedSurgeons[surgeon] ?? false;

                                    return (
                                        <div key={surgeon} className="border border-purple-200 rounded-xl">
                                            {/* Surgeon Header */}
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3 flex items-center justify-between cursor-pointer hover:from-purple-600 hover:to-indigo-600 transition-all rounded-t-xl"
                                                onClick={() => handleToggleSurgeonCollapse(surgeon)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">👨‍⚕️</span>
                                                    <span className="font-bold text-white text-lg">{surgeon}</span>
                                                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                        {patients.length} ราย
                                                    </span>
                                                </div>
                                                <svg
                                                    className={`w-5 h-5 text-white transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {/* Patient List */}
                                            {!isCollapsed && (
                                                <div className="bg-purple-50/50 divide-y divide-purple-100 rounded-b-xl">
                                                    {patients.map((patient, idx) => (
                                                        <div key={patient.id} className="p-2">
                                                            <EmergencyPatientCard
                                                                patient={patient}
                                                                index={idx}
                                                                totalPatients={patients.length}
                                                                onSetQueue={(queueNum) => handleEmergencySetQueue(patient.id, queueNum)}
                                                                onSelectOR={(or) => handleEmergencySelectOR(patient.id, or)}
                                                                onSetNotReady={(r, n) => handleEmergencySetNotReady(patient.id, r, n)}
                                                                onSetReady={() => handleEmergencySetReady(patient.id)}
                                                                onClick={() => setSelectedEmergencyPatient(patient)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Legend */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
                <h4 className="font-medium text-slate-700 mb-3">คำอธิบาย</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">1</span>
                        <span className="text-slate-600">ลำดับคิว (สามารถเลื่อนขึ้น-ลงได้)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">⚠️ ไม่พร้อม</span>
                        <span className="text-slate-600">ผู้ป่วยยังไม่พร้อมผ่าตัด</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">✓ พร้อม</span>
                        <span className="text-slate-600">ยืนยันพร้อมผ่าตัด</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded text-xs">✅ ผ่าตัดเสร็จ</span>
                        <span className="text-slate-600">ยืนยันข้อมูลครบถ้วน (คลิกที่ผู้ป่วยเพื่อยืนยัน)</span>
                    </div>
                </div>
            </div>

            {/* Patient Confirmation Modal */}
            {selectedPatient && (
                <PatientConfirmationModal
                    patient={selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                    onConfirm={handleConfirmPatient}
                />
            )}

            {/* Emergency Patient Confirmation Modal */}
            {selectedEmergencyPatient && (
                <PatientConfirmationModal
                    patient={selectedEmergencyPatient}
                    onClose={() => setSelectedEmergencyPatient(null)}
                    onConfirm={handleConfirmEmergencyPatient}
                />
            )}
        </div>
    );
}
