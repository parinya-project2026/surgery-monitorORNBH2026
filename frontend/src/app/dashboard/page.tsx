'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { patientsApi } from '@/lib/api';
import TodayWorkScheduleCard from '@/components/TodayWorkScheduleCard';

interface Stats {
    total_today: number;
    waiting: number;
    in_surgery: number;
    recovering: number;
    postponed: number;
    returning: number;
    elective_count: number;
    emergency_count: number;
}

const statusColors = {
    waiting: { bg: 'bg-yellow-500', text: 'รอผ่าตัด', icon: '⏳' },
    in_surgery: { bg: 'bg-red-500', text: 'กำลังผ่าตัด', icon: '🔴' },
    recovering: { bg: 'bg-green-500', text: 'กำลังพักฟื้น', icon: '💚' },
    postponed: { bg: 'bg-gray-500', text: 'เลื่อน', icon: '⏸️' },
    returning: { bg: 'bg-blue-500', text: 'ส่งกลับตึก', icon: '🔵' },
};

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const fetchStats = async () => {
            const response = await patientsApi.getStats();
            if (response.data) {
                setStats(response.data);
            }
            setLoading(false);
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Work Schedule Card */}
            <Link href="/dashboard/work-schedule">
                <TodayWorkScheduleCard />
            </Link>

            {/* Current Time */}
            <div className="text-right text-sm text-slate-500">
                อัพเดทล่าสุด: {currentTime.toLocaleTimeString('th-TH')} น.
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Today */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">ผู้ป่วยวันนี้ทั้งหมด</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{stats?.total_today || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-4 text-sm">
                        <span className="text-green-600">Elective: {stats?.elective_count || 0}</span>
                        <span className="text-red-600">Emergency: {stats?.emergency_count || 0}</span>
                    </div>
                </div>

                {/* Waiting */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">🟡 รอผ่าตัด</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">{stats?.waiting || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">
                            ⏳
                        </div>
                    </div>
                </div>

                {/* In Surgery */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">🔴 กำลังผ่าตัด</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{stats?.in_surgery || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Recovering */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">🟢 กำลังพักฟื้น</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{stats?.recovering || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                            💚
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Postponed */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">⚪ เลื่อนการผ่าตัด</p>
                            <p className="text-3xl font-bold text-gray-600 mt-1">{stats?.postponed || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                            ⏸️
                        </div>
                    </div>
                </div>

                {/* Returning */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">🔵 กำลังส่งกลับตึก</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.returning || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                            🏥
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">การดำเนินการด่วน</h3>
                <div className="flex flex-wrap gap-3">
                    <a href="/dashboard/elective" className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                        + เพิ่มผู้ป่วย Elective
                    </a>
                    <a href="/dashboard/emergency" className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                        + เพิ่มผู้ป่วย Emergency
                    </a>
                    <a href="/dashboard/status" className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                        📋 ดูสถานะทั้งหมด
                    </a>
                </div>
            </div>
        </div>
    );
}
