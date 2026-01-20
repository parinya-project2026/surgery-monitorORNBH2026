'use client';

import { useState, useEffect } from 'react';

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

// Helper to format date in Local Time (YYYY-MM-DD)
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function TodayWorkScheduleCard() {
    const [todaySchedules, setTodaySchedules] = useState<WorkScheduleData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchToday = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/work-schedule/${formatDate(new Date())}`);
                if (response.ok) {
                    setTodaySchedules(await response.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchToday();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex justify-center items-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (todaySchedules.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center border-dashed">
                <p className="text-slate-400 text-lg">ยังไม่มีข้อมูลเวรวันนี้</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-6 text-white border-4 border-emerald-400/30 transform transition-all hover:scale-[1.01]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 drop-shadow-md">
                    <span className="text-3xl">🏥</span> วันนี้
                </h3>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
            </div>

            <div className="flex flex-col gap-6">
                {todaySchedules.map((schedule, idx) => (
                    <div key={idx} className={`relative bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-white/20 shadow-lg ${idx > 0 ? 'mt-4' : ''}`}>
                        {/* Shift Badge */}
                        <div className="absolute top-4 right-4 z-10">
                            {schedule.shift_type === 'afternoon' ?
                                <span className="px-4 py-1.5 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full text-sm font-bold shadow-lg ring-2 ring-white/20">🌅 เวรบ่าย</span> :
                                <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-full text-sm font-bold shadow-lg ring-2 ring-white/20">🌙 เวรดึก</span>
                            }
                        </div>

                        <div className="space-y-6 mt-2">
                            {/* Incharge */}
                            {schedule.incharge && (
                                <div className="text-center group">
                                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2 opacity-80">👑 Incharge หัวหน้าเวร</p>
                                    <div className="inline-block px-8 py-3 bg-gradient-to-r from-yellow-200 to-orange-300 text-orange-900 rounded-2xl text-xl font-black shadow-xl transform group-hover:scale-110 transition-all cursor-default ring-4 ring-orange-400/30 border-2 border-white/50">
                                        {schedule.incharge}
                                    </div>
                                </div>
                            )}

                            {/* Nurses */}
                            <div>
                                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-3 text-center opacity-80">👩‍⚕️ ทีมพยาบาล</p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {[schedule.nurse_1, schedule.nurse_2, schedule.nurse_3, schedule.nurse_4, schedule.nurse_5, schedule.nurse_6].filter(Boolean).map((nurse, i) => (
                                        <span key={i} className="px-4 py-2 bg-white/95 text-teal-800 rounded-xl text-sm font-bold shadow-md hover:bg-white hover:scale-105 transition-all cursor-default border-b-4 border-teal-200/80">
                                            {nurse}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Key Person */}
                            {(schedule.shift_type === 'afternoon' && schedule.key_person) && (
                                <div className="text-center pt-2 border-t border-white/10">
                                    <div className="inline-flex items-center gap-3 bg-purple-600/40 px-6 py-2 rounded-xl border border-purple-300/30 backdrop-blur-md">
                                        <span className="text-xl">🔑</span>
                                        <span className="text-purple-100 text-sm font-medium">เวร Key:</span>
                                        <div className="bg-purple-100 text-purple-900 px-3 py-0.5 rounded-lg font-bold shadow-sm">
                                            {schedule.key_person}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
