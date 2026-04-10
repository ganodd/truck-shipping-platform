'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { decodeJwt, type JwtPayload } from '../lib/jwt';

interface AuthStore {
  accessToken: string | null;
  user: JwtPayload | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      login: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        const user = decodeJwt(accessToken);
        set({ accessToken, user });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ accessToken: null, user: null });
      },
    }),
    { name: 'auth' },
  ),
);
