'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Nav } from '../../components/Nav';
import { isTokenExpired } from '../../lib/jwt';
import { useAuthStore } from '../../store/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || isTokenExpired(accessToken)) {
      logout();
      router.push('/login');
    }
  }, [accessToken, logout, router]);

  if (!accessToken) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
