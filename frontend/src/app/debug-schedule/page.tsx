'use client';

import { useEffect, useState } from 'react';
import { getSurgeonORRoom, getWeekOfMonth } from '@/lib/or-schedule';

export default function DebugSchedulePage() {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const log = (msg: string) => setLogs(prev => [...prev, msg]);

        // Test Date: Jan 5, 2026
        const testDate = new Date('2026-01-05T12:00:00');

        log(`--- Debug Info ---`);
        log(`Test Date: ${testDate.toDateString()}`);
        log(`Week of Month: ${getWeekOfMonth(testDate)}`);
        log(`Day: ${testDate.getDay()} (Monday=1)`); // JS getDay: Sun=0, Mon=1

        const testCases = [
            { name: 'นพ.สุริยา คุณาชน', dept: 'Surgery' },
            { name: 'พญ.รัฐพร ตั้งเพียร', dept: 'Surgery' },
            { name: 'นพ.ณัฐพงศ์ ศรีโพนทอง', dept: 'Orthopedics' },
            { name: 'นพ.ชัชพล องค์โฆษิต', dept: 'Orthopedics' },
            { name: 'พญ.พิรุณยา แสนวันดี', dept: 'ENT' },
            { name: 'พญ.สีชมพู ตั้งสัตยาธิษฐาน', dept: 'Ophthalmology' },
        ];

        log('\n--- Assignment Results ---');
        testCases.forEach(tc => {
            const room = getSurgeonORRoom(tc.name, testDate);
            log(`Doctor: ${tc.name} -> Assigned: "${room}"`);
        });

    }, []);

    return (
        <div className="p-8 font-mono text-sm bg-slate-900 text-green-400 min-h-screen">
            <h1 className="text-xl font-bold mb-4">Debug Schedule Engine</h1>
            {logs.map((L, i) => <div key={i}>{L}</div>)}
        </div>
    );
}
