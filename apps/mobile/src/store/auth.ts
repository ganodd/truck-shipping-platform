import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

function parseJwt(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload)) as AuthUser & { sub?: string };
    return {
      userId: decoded.userId ?? decoded.sub ?? '',
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ user, token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, token: null });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      const user = parseJwt(token);
      if (user) set({ user, token });
    }
  },
}));
