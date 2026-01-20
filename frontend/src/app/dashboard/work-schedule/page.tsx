'use client';

import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { NURSES, STAFF_ASSISTANTS, STAFF_WORKERS } from '../surgery-board/constants';
import ThaiDatePicker from '@/components/ThaiDatePicker';
import TodayWorkScheduleCard from '@/components/TodayWorkScheduleCard';

type ShiftType = 'afternoon' | 'night';

interface WorkScheduleData {
    id?: number;
    date: string;
    shift_type: ShiftType;
    incharge: string;
    nurse_1: string;
    nurse_2: string;
    nurse_3: string;
    nurse_4: string;
    nurse_5: string;
    nurse_6: string;
    assistant_1: string;
    assistant_2: string;
    worker_1: string;
    worker_2: string;
    worker_3: string;
    key_person: string;
}

interface MonthSchedule {
    id: number;
    date: string;
    shift_type: ShiftType;
}

const emptyForm = {
    incharge: '',
    nurse_1: '',
    nurse_2: '',
    nurse_3: '',
    nurse_4: '',
    nurse_5: '',
    nurse_6: '',
    assistant_1: '',
    assistant_2: '',
    worker_1: '',
    worker_2: '',
    worker_3: '',
    key_person: '',
};

// Helper to format date in Local Time (YYYY-MM-DD)
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Get Thai month name
const getThaiMonthName = (month: number): string => {
    const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[month];
};

// Searchable Select Component
function StaffSelect({
    label,
    value,
    onChange,
    options,
    placeholder = 'เลือกรายชื่อ...',
    usedNames = [],
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder?: string;
    usedNames?: string[];
}) {
    const availableOptions = useMemo(() =>
        options.filter(opt => opt === value || !usedNames.includes(opt)),
        [options, usedNames, value]
    );

    const selectOptions = useMemo(() =>
        availableOptions.map(opt => ({ value: opt, label: opt })),
        [availableOptions]
    );

    return (
        <div>
            {label && <label className="block text-sm font-medium text-cyan-700 mb-1">{label}</label>}
            <Select
                value={value ? { value, label: value } : null}
                onChange={(opt) => onChange(opt?.value || '')}
                options={selectOptions}
                placeholder={placeholder}
                isClearable
                classNames={{
                    control: () => 'border-cyan-200 hover:border-cyan-400 min-h-[38px]',
                    valueContainer: () => 'py-0.5 px-2',
                    indicatorsContainer: () => 'py-0',
                }}
            />
        </div>
    );
}

export default function WorkSchedulePage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [shiftType, setShiftType] = useState<ShiftType>('afternoon');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [monthSchedules, setMonthSchedules] = useState<MonthSchedule[]>([]);
    const [selectedDetail, setSelectedDetail] = useState<WorkScheduleData | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<typeof emptyForm>(emptyForm);
    // Form state
    const [form, setForm] = useState<typeof emptyForm>(emptyForm);

    // Reset form when switching shift types
    useEffect(() => {
        if (shiftType === 'night') {
            setForm(prev => ({
                ...prev,
                nurse_3: '', nurse_4: '', nurse_5: '', nurse_6: '',
                assistant_2: '',
                worker_2: '', worker_3: '',
                key_person: ''
            }));
        }
    }, [shiftType]);

    // Validation
    const validateForm = (formData: typeof form, shift: ShiftType): string | null => {
        if (!formData.incharge) return 'กรุณาเลือก Incharge';
        if (!formData.nurse_1 || !formData.nurse_2) return 'กรุณาเลือกพยาบาลวิชาชีพให้ครบ (เวรดึกต้องมี 2 คน)';
        if (!formData.assistant_1) return 'กรุณาเลือกพนักงานผู้ช่วย';
        if (!formData.worker_1) return 'กรุณาเลือกคนงาน';

        if (shift === 'afternoon') {
            if (!formData.nurse_3 || !formData.nurse_4 || !formData.nurse_5 || !formData.nurse_6)
                return 'กรุณาเลือกพยาบาลวิชาชีพให้ครบ 6 คน (เวรบ่าย)';
            if (!formData.assistant_2) return 'กรุณาเลือกพนักงานผู้ช่วยให้ครบ 2 คน';
            if (!formData.worker_2 || !formData.worker_3) return 'กรุณาเลือกคนงานให้ครบ 3 คน';
            if (!formData.key_person) return 'กรุณาเลือกเวร Key';
        }

        const allNames = [
            formData.incharge,
            formData.nurse_1, formData.nurse_2,
            shift === 'afternoon' ? formData.nurse_3 : null,
            shift === 'afternoon' ? formData.nurse_4 : null,
            shift === 'afternoon' ? formData.nurse_5 : null,
            shift === 'afternoon' ? formData.nurse_6 : null,
            formData.assistant_1,
            shift === 'afternoon' ? formData.assistant_2 : null,
            formData.worker_1,
            shift === 'afternoon' ? formData.worker_2 : null,
            shift === 'afternoon' ? formData.worker_3 : null,
            shift === 'afternoon' ? formData.key_person : null,
        ].filter(Boolean) as string[];

        const duplicates = allNames.filter((name, idx) => allNames.indexOf(name) !== idx);
        if (duplicates.length > 0) return `พบชื่อซ้ำ: ${[...new Set(duplicates)].join(', ')}`;

        return null;
    };

    const getUsedNames = (formData: typeof form, shift: ShiftType) => {
        const names: string[] = [];
        if (formData.incharge) names.push(formData.incharge);
        names.push(formData.nurse_1, formData.nurse_2);
        if (shift === 'afternoon') names.push(formData.nurse_3, formData.nurse_4, formData.nurse_5, formData.nurse_6);
        names.push(formData.assistant_1);
        if (shift === 'afternoon') names.push(formData.assistant_2);
        names.push(formData.worker_1);
        if (shift === 'afternoon') names.push(formData.worker_2, formData.worker_3);
        if (shift === 'afternoon' && formData.key_person) names.push(formData.key_person);
        return names.filter(Boolean);
    };

    const usedNames = useMemo(() => getUsedNames(form, shiftType), [form, shiftType]);
    const editUsedNames = useMemo(() => selectedDetail ? getUsedNames(editForm, selectedDetail.shift_type) : [], [editForm, selectedDetail]);

    const handleChange = (field: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [field]: value }));
    const handleEditChange = (field: keyof typeof editForm, value: string) => setEditForm(prev => ({ ...prev, [field]: value }));

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                const dateStr = formatDate(selectedDate);
                const response = await fetch(`http://localhost:8000/api/work-schedule/${dateStr}/${shiftType}`);
                if (response.ok) {
                    const data = await response.json();
                    setForm({
                        incharge: data.incharge || '',
                        nurse_1: data.nurse_1 || '',
                        nurse_2: data.nurse_2 || '',
                        nurse_3: data.nurse_3 || '',
                        nurse_4: data.nurse_4 || '',
                        nurse_5: data.nurse_5 || '',
                        nurse_6: data.nurse_6 || '',
                        assistant_1: data.assistant_1 || '',
                        assistant_2: data.assistant_2 || '',
                        worker_1: data.worker_1 || '',
                        worker_2: data.worker_2 || '',
                        worker_3: data.worker_3 || '',
                        key_person: data.key_person || '',
                    });
                } else {
                    setForm(emptyForm);
                }
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchSchedule();
    }, [selectedDate, shiftType]);

    useEffect(() => {
        const fetchMonthSchedules = async () => {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;
            try {
                const response = await fetch(`http://localhost:8000/api/work-schedule/month/${year}/${month}`);
                if (response.ok) {
                    const data = await response.json();
                    setMonthSchedules(data.map((s: any) => ({ id: s.id, date: s.date, shift_type: s.shift_type })));
                }
            } catch (e) { console.error(e); }
        };
        fetchMonthSchedules();
    }, [selectedDate]);



    const handleSave = async () => {
        const error = validateForm(form, shiftType);
        if (error) { await Swal.fire({ icon: 'error', title: 'ข้อมูลไม่ถูกต้อง', text: error }); return; }

        setSaving(true);
        try {
            const body = { date: formatDate(selectedDate), shift_type: shiftType, ...form };
            if (shiftType === 'night') {
                Object.assign(body, {
                    nurse_3: null, nurse_4: null, nurse_5: null, nurse_6: null,
                    assistant_2: null, worker_2: null, worker_3: null, key_person: null
                });
            }
            const response = await fetch('http://localhost:8000/api/work-schedule/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ!', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
                refreshData();
            } else throw new Error('Failed to save');
        } catch (error) { await Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถบันทึกข้อมูลได้' }); }
        finally { setSaving(false); }
    };

    const refreshData = async () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        fetch(`http://localhost:8000/api/work-schedule/month/${year}/${month}`).then(r => r.json()).then(d => setMonthSchedules(d.map((s: any) => ({ id: s.id, date: s.date, shift_type: s.shift_type }))));
    };

    const viewDetail = async (date: string, shift: ShiftType) => {
        try {
            const res = await fetch(`http://localhost:8000/api/work-schedule/${date}/${shift}`);
            if (res.ok) { setSelectedDetail(await res.json()); setEditMode(false); }
        } catch (e) { console.error(e); }
    };

    const startEdit = () => {
        if (!selectedDetail) return;
        setEditForm({
            incharge: selectedDetail.incharge || '',
            nurse_1: selectedDetail.nurse_1 || '',
            nurse_2: selectedDetail.nurse_2 || '',
            nurse_3: selectedDetail.nurse_3 || '',
            nurse_4: selectedDetail.nurse_4 || '',
            nurse_5: selectedDetail.nurse_5 || '',
            nurse_6: selectedDetail.nurse_6 || '',
            assistant_1: selectedDetail.assistant_1 || '',
            assistant_2: selectedDetail.assistant_2 || '',
            worker_1: selectedDetail.worker_1 || '',
            worker_2: selectedDetail.worker_2 || '',
            worker_3: selectedDetail.worker_3 || '',
            key_person: selectedDetail.key_person || '',
        });
        setEditMode(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedDetail) return;
        const error = validateForm(editForm, selectedDetail.shift_type);
        if (error) { await Swal.fire({ icon: 'error', title: 'ข้อมูลไม่ถูกต้อง', text: error }); return; }

        try {
            const body = { date: selectedDetail.date, shift_type: selectedDetail.shift_type, ...editForm };
            if (selectedDetail.shift_type === 'night') {
                Object.assign(body, {
                    nurse_3: null, nurse_4: null, nurse_5: null, nurse_6: null,
                    assistant_2: null, worker_2: null, worker_3: null, key_person: null
                });
            }
            const response = await fetch('http://localhost:8000/api/work-schedule/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ!', timer: 1500, showConfirmButton: false });
                setSelectedDetail(null); setEditMode(false); refreshData();
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        const confirm = await Swal.fire({ title: 'ยืนยันการลบ?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'ลบ' });
        if (confirm.isConfirmed) {
            await fetch(`http://localhost:8000/api/work-schedule/${id}`, { method: 'DELETE' });
            setSelectedDetail(null); refreshData(); Swal.fire('ลบเรียบร้อย', '', 'success');
        }
    };

    const calendarDays = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = formatDate(new Date(year, month, d));
            const schedules = monthSchedules.filter(s => s.date === dateStr);
            const isToday = dateStr === formatDate(new Date());
            days.push({ day: d, dateStr, schedules, isToday });
        }
        return days;
    }, [selectedDate, monthSchedules]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold flex items-center gap-3">📋 ตารางปฏิบัติงานประจำวัน</h1>
                <p className="text-cyan-100 mt-1">บันทึกตารางเวรบ่าย / เวรดึก</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Form Section - Reduced width (7/12) */}
                <div className="xl:col-span-7 bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
                    <div className="flex flex-wrap gap-4 mb-6 items-end">
                        <div className="w-full md:w-auto">
                            <ThaiDatePicker value={selectedDate} onChange={setSelectedDate} />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShiftType('afternoon')}
                                className={`px-4 py-2 rounded-xl font-medium transition-all ${shiftType === 'afternoon' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-orange-100'}`}
                            >
                                🌅 เวรบ่าย
                            </button>
                            <button
                                onClick={() => {
                                    setShiftType('night');
                                    // เวรดึก: เลื่อนวันที่ไปวันถัดไปอัตโนมัติ (เพื่อบันทึกลงปฏิทินวันถัดไป)
                                    const nextDay = new Date(selectedDate);
                                    nextDay.setDate(nextDay.getDate() + 1);
                                    setSelectedDate(nextDay);
                                }}
                                className={`px-4 py-2 rounded-xl font-medium transition-all ${shiftType === 'night' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-indigo-100'}`}
                            >
                                🌙 เวรดึก
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div></div>
                    ) : (
                        <div className="space-y-5">
                            {/* Incharge */}
                            <div className="bg-cyan-50 rounded-xl p-3 border border-cyan-200">
                                <h3 className="text-base font-semibold text-cyan-800 mb-2">👑 Incharge (หัวหน้าเวร) {shiftType === 'night' && <span className="text-xs text-red-500">*</span>}</h3>
                                <StaffSelect label="" value={form.incharge} onChange={(val) => handleChange('incharge', val)} options={NURSES} usedNames={usedNames} placeholder="-- เลือก Incharge --" />
                            </div>

                            {/* Nurses */}
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                                <h3 className="text-base font-semibold text-blue-800 mb-2">👩‍⚕️ พยาบาลวิชาชีพ ({shiftType === 'afternoon' ? '6' : '2'} คน)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[1, 2].map(i => (
                                        <StaffSelect key={i} label={`${i}. พยาบาล`} value={form[`nurse_${i}` as keyof typeof form]} onChange={(val) => handleChange(`nurse_${i}` as keyof typeof form, val)} options={NURSES} usedNames={usedNames} />
                                    ))}
                                    {shiftType === 'afternoon' && [3, 4, 5, 6].map(i => (
                                        <StaffSelect key={i} label={`${i}. พยาบาล`} value={form[`nurse_${i}` as keyof typeof form]} onChange={(val) => handleChange(`nurse_${i}` as keyof typeof form, val)} options={NURSES} usedNames={usedNames} />
                                    ))}
                                </div>
                            </div>

                            {/* Assistants */}
                            <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                                <h3 className="text-base font-semibold text-green-800 mb-2">🤝 พนักงานผู้ช่วย ({shiftType === 'afternoon' ? '2' : '1'} คน)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <StaffSelect label="1. ผู้ช่วย" value={form.assistant_1} onChange={(val) => handleChange('assistant_1', val)} options={STAFF_ASSISTANTS} usedNames={usedNames} />
                                    {shiftType === 'afternoon' && (
                                        <StaffSelect label="2. ผู้ช่วย" value={form.assistant_2} onChange={(val) => handleChange('assistant_2', val)} options={STAFF_ASSISTANTS} usedNames={usedNames} />
                                    )}
                                </div>
                            </div>

                            {/* Workers */}
                            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                                <h3 className="text-base font-semibold text-yellow-800 mb-2">🛠️ คนงาน ({shiftType === 'afternoon' ? '3' : '1'} คน)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <StaffSelect label="1. คนงาน" value={form.worker_1} onChange={(val) => handleChange('worker_1', val)} options={STAFF_WORKERS} usedNames={usedNames} />
                                    {shiftType === 'afternoon' && (
                                        <>
                                            <StaffSelect label="2. คนงาน" value={form.worker_2} onChange={(val) => handleChange('worker_2', val)} options={STAFF_WORKERS} usedNames={usedNames} />
                                            <StaffSelect label="3. คนงาน" value={form.worker_3} onChange={(val) => handleChange('worker_3', val)} options={STAFF_WORKERS} usedNames={usedNames} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Key Person (Only Afternoon) */}
                            {shiftType === 'afternoon' && (
                                <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                                    <h3 className="text-base font-semibold text-purple-800 mb-2">🔑 เวร Key</h3>
                                    <StaffSelect label="" value={form.key_person} onChange={(val) => handleChange('key_person', val)} options={STAFF_ASSISTANTS} usedNames={usedNames} placeholder="-- เลือกเวร Key --" />
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button onClick={handleSave} disabled={saving} className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : '💾 บันทึกตารางเวร'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side - Increased width (5/12) & Reordered */}
                <div className="xl:col-span-5 space-y-6">
                    {/* Today Display - Moved to TOP & Enhanced BUTTON STYLE */}
                    <TodayWorkScheduleCard />

                    {/* Calendar */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            📅 ปฏิทินงาน
                        </h3>
                        {/* Month Nav */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">◀</button>
                            <span className="font-bold text-slate-700 text-lg">{getThaiMonthName(selectedDate.getMonth())} {selectedDate.getFullYear() + 543}</span>
                            <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">▶</button>
                        </div>
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 font-medium text-slate-400">{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => <div key={d}>{d}</div>)}</div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, idx) => (
                                <div key={idx} className="aspect-square">
                                    {day ? (
                                        <div onClick={() => day.schedules.length > 0 && viewDetail(day.dateStr, day.schedules[0].shift_type)} className={`h-full rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md ${day.isToday ? 'bg-cyan-50 border-2 border-cyan-400' : 'bg-slate-50 hover:bg-white'} ${day.schedules.length > 0 ? 'bg-white border border-slate-200' : ''}`}>
                                            <span className={`text-sm font-bold ${day.isToday ? 'text-cyan-600' : 'text-slate-600'}`}>{day.day}</span>
                                            <div className="flex gap-1 mt-1">
                                                {day.schedules.some(s => s.shift_type === 'afternoon') && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-sm" />}
                                                {day.schedules.some(s => s.shift_type === 'night') && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-center gap-4 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-400 rounded-full shadow-sm"></span> เวรบ่าย</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm"></span> เวรดึก</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-teal-500 text-white p-4 rounded-t-2xl flex justify-between items-center shadow-md z-10">
                            <h3 className="text-lg font-bold">รายละเอียดเวร{selectedDetail.shift_type === 'afternoon' ? 'บ่าย' : 'ดึก'}</h3>
                            <button onClick={() => setSelectedDetail(null)} className="text-2xl hover:opacity-80 transition-opacity">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-600 font-medium flex items-center gap-2">
                                📅 วันที่: <span className="text-slate-800 font-bold text-lg">{selectedDetail.date}</span>
                            </p>
                            {!editMode ? (
                                <>
                                    <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 shadow-sm">
                                        <p className="text-xs text-cyan-600 font-bold uppercase tracking-wide mb-1">Incharge</p>
                                        <p className="text-slate-800 font-bold text-lg">{selectedDetail.incharge}</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-2">พยาบาลวิชาชีพ</p>
                                        <ul className="text-slate-800 text-sm space-y-2">
                                            {[1, 2, 3, 4, 5, 6].map(i => selectedDetail[`nurse_${i}` as keyof WorkScheduleData] && (
                                                <li key={i} className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs flex items-center justify-center font-bold">{i}</span>
                                                    {selectedDetail[`nurse_${i}` as keyof WorkScheduleData]}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 p-3 rounded-xl border border-green-100 shadow-sm">
                                            <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-2">ผู้ช่วย</p>
                                            <ul className="text-slate-800 text-sm space-y-1">
                                                <li>1. {selectedDetail.assistant_1}</li>
                                                {selectedDetail.assistant_2 && <li>2. {selectedDetail.assistant_2}</li>}
                                            </ul>
                                        </div>
                                        <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 shadow-sm">
                                            <p className="text-xs text-yellow-600 font-bold uppercase tracking-wide mb-2">คนงาน</p>
                                            <ul className="text-slate-800 text-sm space-y-1">
                                                <li>1. {selectedDetail.worker_1}</li>
                                                {selectedDetail.worker_2 && <li>2. {selectedDetail.worker_2}</li>}
                                                {selectedDetail.worker_3 && <li>3. {selectedDetail.worker_3}</li>}
                                            </ul>
                                        </div>
                                    </div>
                                    {selectedDetail.key_person && (
                                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm">
                                            <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-1">เวร Key</p>
                                            <p className="text-slate-800 font-bold">{selectedDetail.key_person}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-4 border-t mt-2">
                                        <button onClick={startEdit} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-sm">✏️ แก้ไข</button>
                                        <button onClick={() => selectedDetail.id && handleDelete(selectedDetail.id)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-sm">🗑️ ลบ</button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <StaffSelect label="Incharge" value={editForm.incharge} onChange={v => handleEditChange('incharge', v)} options={NURSES} usedNames={editUsedNames} />

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <p className="text-sm font-bold text-slate-700 mb-2">พยาบาล</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[1, 2].map(i => <StaffSelect key={i} label={`คนที่ ${i}`} value={editForm[`nurse_${i}` as keyof typeof editForm]} onChange={v => handleEditChange(`nurse_${i}` as keyof typeof editForm, v)} options={NURSES} usedNames={editUsedNames} />)}
                                            {selectedDetail.shift_type === 'afternoon' && [3, 4, 5, 6].map(i => <StaffSelect key={i} label={`คนที่ ${i}`} value={editForm[`nurse_${i}` as keyof typeof editForm]} onChange={v => handleEditChange(`nurse_${i}` as keyof typeof editForm, v)} options={NURSES} usedNames={editUsedNames} />)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <p className="text-sm font-bold text-slate-700 mb-2">ผู้ช่วย</p>
                                            <div className="space-y-2">
                                                <StaffSelect label="คนที่ 1" value={editForm.assistant_1} onChange={v => handleEditChange('assistant_1', v)} options={STAFF_ASSISTANTS} usedNames={editUsedNames} />
                                                {selectedDetail.shift_type === 'afternoon' && <StaffSelect label="คนที่ 2" value={editForm.assistant_2} onChange={v => handleEditChange('assistant_2', v)} options={STAFF_ASSISTANTS} usedNames={editUsedNames} />}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <p className="text-sm font-bold text-slate-700 mb-2">คนงาน</p>
                                            <div className="space-y-2">
                                                <StaffSelect label="คนที่ 1" value={editForm.worker_1} onChange={v => handleEditChange('worker_1', v)} options={STAFF_WORKERS} usedNames={editUsedNames} />
                                                {selectedDetail.shift_type === 'afternoon' && (
                                                    <>
                                                        <StaffSelect label="คนที่ 2" value={editForm.worker_2} onChange={v => handleEditChange('worker_2', v)} options={STAFF_WORKERS} usedNames={editUsedNames} />
                                                        <StaffSelect label="คนที่ 3" value={editForm.worker_3} onChange={v => handleEditChange('worker_3', v)} options={STAFF_WORKERS} usedNames={editUsedNames} />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedDetail.shift_type === 'afternoon' && <StaffSelect label="เวร Key" value={editForm.key_person} onChange={v => handleEditChange('key_person', v)} options={STAFF_ASSISTANTS} usedNames={editUsedNames} />}

                                    <div className="flex gap-3 pt-4 border-t mt-2">
                                        <button onClick={handleSaveEdit} className="flex-1 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium shadow-sm">💾 บันทึก</button>
                                        <button onClick={() => setEditMode(false)} className="flex-1 py-2.5 bg-slate-400 text-white rounded-xl hover:bg-slate-500 transition-colors font-medium shadow-sm">❌ ยกเลิก</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
