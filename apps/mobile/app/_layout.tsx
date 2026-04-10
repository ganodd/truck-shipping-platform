import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '../src/store/auth';

export default function RootLayout() {
  const { user, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/loads');
    }
  }, [user, segments]);

  return <Slot />;
}
