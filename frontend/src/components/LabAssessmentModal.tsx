'use client';

import { useState } from 'react';
import { LAB_REFERENCES } from '@/lib/lab-data';

type AssessmentStatus = {
    type: 'low' | 'normal' | 'high';
    message: string;
} | null;

interface LabAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (result: string) => void;
}

export default function LabAssessmentModal({ isOpen, onClose, onConfirm }: LabAssessmentModalProps) {
    const [selectedLab, setSelectedLab] = useState('');
    const [labValue, setLabValue] = useState('');
    const [status, setStatus] = useState<AssessmentStatus>(null);
    const [customLabText, setCustomLabText] = useState(''); // For "อื่นๆ" option

    const isOtherSelected = selectedLab === 'other';

    if (!isOpen) return null;

    const handleCheckValue = (labKey: string, value: string) => {
        if (!labKey || value === '') {
            setStatus(null);
            return;
        }

        const numVal = parseFloat(value);
        const ref = LAB_REFERENCES[labKey];

        if (isNaN(numVal)) return;

        if (numVal < ref.min) {
            setStatus({
                type: 'low',
                message: `ต่ำ (Low) - ค่าปกติคือ ${ref.min} - ${ref.max}`
            });
        } else if (numVal > ref.max) {
            setStatus({
                type: 'high',
                message: `สูง (High) - ค่าปกติคือ ${ref.min} - ${ref.max}`
            });
        } else {
            setStatus({
                type: 'normal',
                message: `ปกติ (Normal)`
            });
        }
    };

    const handleSave = () => {
        // Handle "อื่นๆ" option
        if (isOtherSelected) {
            if (!customLabText.trim()) return;
            const resultString = `Lab ไม่พร้อม: ${customLabText.trim()}`;
            onConfirm(resultString);
            // Reset and close
            setSelectedLab('');
            setLabValue('');
            setCustomLabText('');
            setStatus(null);
            onClose();
            return;
        }

        if (!selectedLab || !labValue) return;

        // Format the result string
        // Example: Lab ไม่พร้อม: Potassium (K) = 2.5 (ต่ำ (Low) - ค่าปกติคือ 3.5 - 5.5)
        // Or simplified as per implementation plan: Lab ไม่พร้อม: [LabName] = [Value] ([Assessment])

        let assessmentText = '';
        if (status?.type === 'low') assessmentText = 'Low';
        else if (status?.type === 'high') assessmentText = 'High';
        else assessmentText = 'Normal';

        const ref = LAB_REFERENCES[selectedLab];
        // Result format: Lab ไม่พร้อม: Na = 120 (Low)
        const resultString = `Lab ไม่พร้อม: ${selectedLab} = ${labValue} (${assessmentText})`;

        onConfirm(resultString);

        // Reset and close
        setSelectedLab('');
        setLabValue('');
        setCustomLabText('');
        setStatus(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">🧪 ประเมินค่า Lab Pre-op</h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="p-6 space-y-4">
                    {/* 1. Drop List เลือก Lab */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">เลือกรายการ Lab</label>
                        <select
                            value={selectedLab}
                            onChange={(e) => {
                                setSelectedLab(e.target.value);
                                setLabValue('');
                                setCustomLabText('');
                                setStatus(null);
                            }}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- กรุณาเลือก --</option>
                            {Object.keys(LAB_REFERENCES).map((key) => (
                                <option key={key} value={key}>
                                    {LAB_REFERENCES[key].label}
                                </option>
                            ))}
                            <option value="other">อื่นๆ</option>
                        </select>
                    </div>

                    {/* 2. Input กรอกค่า (for normal labs) */}
                    {selectedLab && !isOtherSelected && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                ระบุค่าที่ได้ ({LAB_REFERENCES[selectedLab].unit})
                            </label>
                            <input
                                type="number"
                                value={labValue}
                                onChange={(e) => {
                                    setLabValue(e.target.value);
                                    handleCheckValue(selectedLab, e.target.value);
                                }}
                                placeholder="เช่น 125"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* 2b. Input พิมพ์ข้อความ (for อื่นๆ) */}
                    {isOtherSelected && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                ระบุรายละเอียด Lab อื่นๆ
                            </label>
                            <input
                                type="text"
                                value={customLabText}
                                onChange={(e) => setCustomLabText(e.target.value)}
                                placeholder="พิมพ์รายละเอียด Lab..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* 3. ส่วนแสดงผล (Display) - only for normal labs */}
                    {status && !isOtherSelected && (
                        <div className={`p-3 rounded-lg border text-sm font-medium ${status.type === 'normal'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                            <strong>ผลการประเมิน: </strong> {status.message}
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedLab || (isOtherSelected ? !customLabText.trim() : !labValue)}
                    >
                        บันทึกผล
                    </button>
                </div>
            </div>
        </div>
    );
}
