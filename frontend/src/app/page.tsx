'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setToken } from '@/lib/api';
import Image from 'next/image';

// Generate particle positions on client side only
interface Particle {
  top: string;
  left: string;
  duration: string;
  delay: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const router = useRouter();

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const newParticles = [...Array(20)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: `${5 + Math.random() * 10}s`,
      delay: `${Math.random() * 5}s`,
    }));
    setParticles(newParticles);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      setToken(response.access_token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating Particles - Client Side Only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30"
            style={{
              top: particle.top,
              left: particle.left,
              animation: `float ${particle.duration} linear infinite`,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(5px); }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <div className="relative w-full max-w-md px-6 z-10">
        {/* Robot Mascot */}
        <div className="flex justify-center mb-8 animate-bounce-slow">
          <div className="relative w-40 h-40 drop-shadow-2xl transform hover:scale-110 transition-all duration-500">
            <Image
              src="/images/robot-nurse.png"
              alt="SurgiTrack AI Assistant"
              fill
              className="object-contain filter drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]"
              priority
            />
          </div>
        </div>

        {/* Title with Glow Effect */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            SurgiTrack AI
          </h1>
          <p className="text-blue-200 text-lg font-light">ระบบแจ้งเตือนสถานะการผ่าตัด Real-time</p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mt-4"></div>
        </div>

        {/* Login Card with 3D Effect */}
        <div className="relative">
          {/* Glow Effect Behind Card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50"></div>

          {/* Main Card */}
          <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 border border-white/20 transform hover:scale-[1.02] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"></div>

            <h2 className="relative text-2xl font-semibold text-white mb-8 text-center flex items-center justify-center gap-3">
              <span className="w-12 h-0.5 bg-gradient-to-r from-transparent to-blue-400"></span>
              เข้าสู่ระบบ
              <span className="w-12 h-0.5 bg-gradient-to-l from-transparent to-blue-400"></span>
            </h2>

            <form onSubmit={handleSubmit} className="relative space-y-6">
              {/* Username */}
              <div className="group">
                <label htmlFor="username" className="block text-sm font-medium text-blue-100 mb-2">
                  ชื่อผู้ใช้
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all shadow-inner backdrop-blur-sm"
                    placeholder="กรอกชื่อผู้ใช้"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all shadow-inner backdrop-blur-sm"
                    placeholder="กรอกรหัสผ่าน"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Error Message with Animation */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-3 animate-shake backdrop-blur-sm">
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit Button with Gradient */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-4 px-6 overflow-hidden rounded-xl font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 group-hover:from-blue-500 group-hover:via-blue-400 group-hover:to-cyan-400 transition-all duration-300"></div>

                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>

                {/* Button Content */}
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      เข้าสู่ระบบ
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* Security Notice with Icon */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm text-blue-200/80">ระบบมีการบันทึก Session Log เพื่อความปลอดภัย</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-bounce-slow {
          animation: bounce 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
