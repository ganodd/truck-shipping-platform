import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../../../src/lib/api';

const GPS_TASK = 'SHIPMENT_GPS_TASK';

// Background GPS task — posts location to the API every update cycle
TaskManager.defineTask(
  GPS_TASK,
  ({ data, error }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
    if (error) return;
    const { locations } = data;
    if (!locations?.length) return;
    const { latitude, longitude } = locations[0].coords;
    // Read active shipment id stored via a module-level variable (set when tracking starts)
    const shipmentId = activeShipmentId;
    if (shipmentId) {
      void api
        .post(`/shipments/${shipmentId}/location`, { latitude, longitude })
        .catch(() => undefined);
    }
  },
);

// Module-level tracking state (survives background task execution)
let activeShipmentId: string | null = null;

interface ShipmentEvent {
  id: string;
  status: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

interface Shipment {
  id: string;
  status: string;
  agreedPrice: number;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
  load: {
    origin: { city: string; state: string; address: string };
    destination: { city: string; state: string; address: string };
    equipmentType: string;
    weightLbs: number;
  };
  events?: ShipmentEvent[];
}

const NEXT_STATUS: Record<string, string> = {
  PENDING_PICKUP: 'IN_TRANSIT',
  IN_TRANSIT: 'DELIVERED',
};

const STATUS_LABEL: Record<string, string> = {
  IN_TRANSIT: 'Mark as Picked Up',
  DELIVERED: 'Mark as Delivered',
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PENDING_PICKUP: { bg: '#fef3c7', text: '#92400e' },
  IN_TRANSIT: { bg: '#dbeafe', text: '#1e40af' },
  DELIVERED: { bg: '#d1fae5', text: '#065f46' },
};

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [tracking, setTracking] = useState(false);

  const fetchShipment = async () => {
    try {
      const res = await api.get<{ data: Shipment }>(`/shipments/${id}`);
      setShipment(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchShipment();
    return () => {
      // Stop background GPS when leaving screen
      void Location.stopLocationUpdatesAsync(GPS_TASK).catch(() => undefined);
      activeShipmentId = null;
    };
  }, [id]);

  // Auto-start GPS tracking when shipment is IN_TRANSIT
  useEffect(() => {
    if (shipment?.status === 'IN_TRANSIT') {
      void startTracking();
    } else {
      void Location.stopLocationUpdatesAsync(GPS_TASK).catch(() => undefined);
      activeShipmentId = null;
      setTracking(false);
    }
  }, [shipment?.status]);

  const startTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission',
        'Background location access is required for GPS tracking. Please grant it in Settings.',
      );
      return;
    }
    activeShipmentId = id;
    await Location.startLocationUpdatesAsync(GPS_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30_000, // every 30 seconds
      distanceInterval: 100, // or every 100 meters
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'TruckShip Tracking',
        notificationBody: 'Sharing your location for this shipment.',
      },
    });
    setTracking(true);
  };

  const updateStatus = async (nextStatus: string) => {
    setUpdating(true);
    setUpdateError('');
    try {
      await api.patch(`/shipments/${id}/status`, { status: nextStatus });
      await fetchShipment();
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!shipment) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Shipment not found.</Text>
      </View>
    );
  }

  const nextStatus = NEXT_STATUS[shipment.status];
  const statusColor = STATUS_COLOR[shipment.status] ?? { bg: '#f3f4f6', text: '#374151' };
  const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor.bg }]}>
        <Text style={[styles.statusText, { color: statusColor.text }]}>
          {shipment.status.replace(/_/g, ' ')}
        </Text>
        {tracking && <Text style={styles.gpsIndicator}>📍 GPS Active</Text>}
      </View>

      {/* Route */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route</Text>
        <Text style={styles.routeText}>
          From: {shipment.load.origin.city}, {shipment.load.origin.state}
        </Text>
        <Text style={styles.routeText}>
          To: {shipment.load.destination.city}, {shipment.load.destination.state}
        </Text>
        <Text style={styles.detail}>
          Equipment: {shipment.load.equipmentType.replace(/_/g, ' ')}
        </Text>
        <Text style={styles.detail}>Weight: {shipment.load.weightLbs.toLocaleString()} lbs</Text>
      </View>

      {/* Financials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financials</Text>
        <Row label="Agreed Price" value={`$${(shipment.agreedPrice / 100).toLocaleString()}`} />
        <Row label="Picked Up" value={fmt(shipment.pickedUpAt)} />
        <Row label="Delivered" value={fmt(shipment.deliveredAt)} />
      </View>

      {/* Status update */}
      {nextStatus && (
        <View style={styles.actionSection}>
          {updateError ? <Text style={styles.error}>{updateError}</Text> : null}
          <Pressable
            style={styles.actionBtn}
            onPress={() => void updateStatus(nextStatus)}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>
                {STATUS_LABEL[nextStatus] ?? `Mark as ${nextStatus.replace(/_/g, ' ')}`}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Event timeline */}
      {shipment.events && shipment.events.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {shipment.events.map((ev, i) => (
            <View
              key={ev.id}
              style={[styles.event, i < (shipment.events?.length ?? 0) - 1 && styles.eventBorder]}
            >
              <View style={styles.eventDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventStatus}>{ev.status.replace(/_/g, ' ')}</Text>
                <Text style={styles.eventTime}>{new Date(ev.timestamp).toLocaleString()}</Text>
                {ev.latitude != null && (
                  <Text style={styles.eventGps}>
                    GPS: {ev.latitude.toFixed(4)}, {ev.longitude?.toFixed(4)}
                  </Text>
                )}
                {ev.notes && <Text style={styles.eventNotes}>{ev.notes}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#9ca3af', fontSize: 15 },
  statusBanner: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: { fontSize: 16, fontWeight: '700' },
  gpsIndicator: { fontSize: 13, fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  routeText: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  detail: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLabel: { fontSize: 14, color: '#6b7280' },
  rowValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  actionSection: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  actionBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 13,
  },
  event: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  eventBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  eventDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#60a5fa', marginTop: 4 },
  eventStatus: { fontSize: 14, fontWeight: '600', color: '#111827' },
  eventTime: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  eventGps: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  eventNotes: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 2 },
});
