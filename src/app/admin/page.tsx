'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login gagal');
      } else {
        router.push('/admin/dashboard');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/icons/icon-72x72.png"
            alt=""
            width={64}
            height={64}
            className="w-16 h-16 rounded-2xl shadow-lg shadow-black/30 mb-4 mx-auto"
          />
          <h1 className="text-2xl font-bold text-white">Ferdii-AI-Asissten</h1>
          <p className="text-teal-300 text-sm mt-1">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Masuk sebagai Admin</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-200 mb-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@adi-muhamad.my.id"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <i className="fas fa-circle-exclamation text-red-400 text-sm" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-right-to-bracket" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            Akses khusus administrator
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          &copy; 2026 Ferdii-AI-Asissten · adi-muhamad.my.id
        </p>
      </div>
    </div>
  );
}
