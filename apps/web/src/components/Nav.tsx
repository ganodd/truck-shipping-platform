'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '../store/auth';

export function Nav() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-xl font-bold text-blue-600">
          TruckShip
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          Dashboard
        </Link>
        <Link href="/loads/new" className="text-sm text-gray-600 hover:text-gray-900">
          Post Load
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-500">
            {user.email} <span className="text-xs text-blue-600 uppercase">({user.role})</span>
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}
