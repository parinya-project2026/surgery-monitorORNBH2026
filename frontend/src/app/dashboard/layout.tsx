'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authApi, getToken, removeToken } from '@/lib/api';

interface User {
    id: number;
    username: string;
    full_name: string;
    role: string;
}

const menuItems = [
    { name: 'หน้าหลัก', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'ลงทะเบียนผ่าตัด', path: '/dashboard/registration', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { name: 'กระดานผ่าตัด', path: '/dashboard/surgery-board', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'ตารางเวร (บ่าย/ดึก)', path: '/dashboard/work-schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'สถานะ Real-time', path: '/dashboard/status', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Dashboard สถิติ', path: '/dashboard/statistics', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
    { name: 'Admin', path: '/dashboard/admin', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const token = getToken();
            if (!token) {
                router.push('/');
                return;
            }

            const response = await authApi.getMe();
            if (response.error) {
                removeToken();
                router.push('/');
                return;
            }

            setUser(response.data || null);
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        await authApi.logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
                <div className="text-center">
                    <div className="relative w-24 h-24 mb-4 mx-auto">
                        <Image
                            src="/images/robot-nurse.png"
                            alt="Loading"
                            fill
                            className="object-contain animate-bounce filter drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                        />
                    </div>
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
            {/* Sidebar with 3D Effect */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 transition-all duration-300 flex flex-col shadow-2xl border-r border-slate-700/50 relative overflow-hidden`}>
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none"></div>

                {/* Logo Section with Robot Icon */}
                <div className="relative p-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/50 flex items-center justify-center transform hover:scale-110 hover:rotate-3 transition-all duration-300 group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
                            <Image
                                src="/images/robot-nurse.png"
                                alt="SurgiTrack"
                                width={36}
                                height={36}
                                className="object-contain filter drop-shadow-lg relative z-10"
                            />
                        </div>
                        {sidebarOpen && (
                            <div>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                    SurgiTrack AI
                                </span>
                                <p className="text-xs text-slate-400 mt-0.5">Smart Surgery Tracker</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Menu with 3D Effects */}
                <nav className="flex-1 p-4 space-y-2 relative">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        const isAdminOnly = item.path === '/dashboard/admin';

                        if (isAdminOnly && user?.role !== 'admin') return null;

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/50 transform scale-105'
                                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl blur opacity-50 -z-10"></div>
                                )}
                                <svg className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                                {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info in Sidebar */}
                {sidebarOpen && user && (
                    <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                                {user.full_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
                                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toggle Button with 3D Effect */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="m-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-lg group"
                >
                    <svg className={`w-5 h-5 mx-auto transition-transform duration-300 group-hover:scale-110 ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header with Glassmorphism */}
                <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200/50 px-6 py-4 sticky top-0 z-40">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                {menuItems.find(item => item.path === pathname)?.name || 'Dashboard'}
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">ระบบแจ้งเตือนสถานะการผ่าตัด Real-time</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Logout Button with 3D Effect */}
                            <button
                                onClick={handleLogout}
                                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 hover:scale-105"
                                title="ออกจากระบบ"
                            >
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="text-sm font-medium">ออกจากระบบ</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
