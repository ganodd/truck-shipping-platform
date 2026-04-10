'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{ data: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        { email, password },
      );
      login(data.data.accessToken, data.data.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">TruckShip</h1>
          <p className="mt-1 text-gray-500">Sign in to your account</p>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="rounded-xl bg-white p-8 shadow-sm border border-gray-200"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          No account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Get started
          </Link>
        </p>
      </div>
    </main>
  );
}
