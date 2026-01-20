'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

// Thai Month Names
const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

interface ThaiDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label?: string;
    className?: string;
}

export default function ThaiDatePicker({
    value,
    onChange,
    label = "วันที่",
    className = ""
}: ThaiDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(new Date(value || new Date()));
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync viewDate when value changes
    useEffect(() => {
        if (value) {
            setViewDate(new Date(value));
        }
    }, [value]);

    // Generate Calendar Grid
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Previous month filler
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    }, [viewDate]);

    // Handle Year Change
    const changeYear = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setFullYear(newDate.getFullYear() + offset);
        setViewDate(newDate);
    };

    // Handle Month Change
    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    // Format display date (DD/MM/YYYY(BE))
    const formatDateDisplay = (date: Date) => {
        if (!date) return "";
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const yearBE = date.getFullYear() + 543;
        return `${day}/${month}/${yearBE}`;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}

            {/* Input Trigger */}
            <div
                className="relative cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <input
                    type="text"
                    readOnly
                    value={formatDateDisplay(value)}
                    className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white cursor-pointer select-none"
                    placeholder="เลือกวันที่..."
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>

            {/* Popup Calendar */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); changeMonth(-1); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        >
                            ◀
                        </button>
                        <div className="text-center">
                            <span className="font-bold text-slate-800 block">
                                {THAI_MONTHS[viewDate.getMonth()]}
                            </span>
                            <span className="text-sm text-slate-500 cursor-pointer hover:text-cyan-600" onClick={(e) => { e.stopPropagation(); /* Could add year picker here */ }}>
                                พ.ศ. {viewDate.getFullYear() + 543}
                            </span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); changeMonth(1); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        >
                            ▶
                        </button>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-slate-500 font-medium">
                        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => <div key={d}>{d}</div>)}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                            if (!day) return <div key={idx} />;

                            const isSelected = day.toDateString() === value.toDateString();
                            const isToday = day.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(day);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        aspect-square flex items-center justify-center rounded-lg text-sm cursor-pointer transition-all
                                        ${isSelected ? 'bg-cyan-500 text-white shadow-md' : 'hover:bg-cyan-50 text-slate-700'}
                                        ${isToday && !isSelected ? 'border border-cyan-500 text-cyan-600' : ''}
                                    `}
                                >
                                    {day.getDate()}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer - Today Button */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const today = new Date();
                                onChange(today);
                                setViewDate(today);
                                setIsOpen(false);
                            }}
                            className="text-xs text-cyan-600 font-medium hover:underline"
                        >
                            วันนี้
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
