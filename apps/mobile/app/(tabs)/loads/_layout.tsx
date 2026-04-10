import { Stack } from 'expo-router';

export default function LoadsStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Load Board' }} />
      <Stack.Screen name="[id]" options={{ title: 'Load Details' }} />
    </Stack>
  );
}
