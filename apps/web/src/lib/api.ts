'use client';

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(err as Error);
  },
);
