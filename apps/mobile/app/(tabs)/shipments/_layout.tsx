import { Stack } from 'expo-router';

export default function ShipmentsStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Shipments' }} />
      <Stack.Screen name="[id]" options={{ title: 'Shipment Detail' }} />
    </Stack>
  );
}
