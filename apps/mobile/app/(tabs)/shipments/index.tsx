import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../../../src/lib/api';

interface Shipment {
  id: string;
  status: string;
  agreedPrice: number;
  createdAt: string;
  load: {
    origin: { city: string; state: string };
    destination: { city: string; state: string };
    equipmentType: string;
  };
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PENDING_PICKUP: { bg: '#fef3c7', text: '#92400e' },
  IN_TRANSIT: { bg: '#dbeafe', text: '#1e40af' },
  DELIVERED: { bg: '#d1fae5', text: '#065f46' },
};

export default function ShipmentsScreen() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShipments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get<{ data: Shipment[] }>('/shipments?limit=50');
      setShipments(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchShipments();
  }, [fetchShipments]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchShipments(true);
  };

  const renderItem = ({ item }: { item: Shipment }) => {
    const color = STATUS_COLOR[item.status] ?? { bg: '#f3f4f6', text: '#374151' };
    return (
      <Pressable style={styles.card} onPress={() => router.push(`/(tabs)/shipments/${item.id}`)}>
        <View style={styles.cardTop}>
          <Text style={styles.route}>
            {item.load.origin.city}, {item.load.origin.state} → {item.load.destination.city},{' '}
            {item.load.destination.state}
          </Text>
          <View style={[styles.badge, { backgroundColor: color.bg }]}>
            <Text style={[styles.badgeText, { color: color.text }]}>
              {item.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>{item.load.equipmentType.replace(/_/g, ' ')}</Text>
          <Text style={styles.price}>${(item.agreedPrice / 100).toLocaleString()}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={shipments}
      keyExtractor={(s) => s.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>No shipments yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  list: { padding: 12, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  route: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 13, color: '#6b7280' },
  price: { fontSize: 14, fontWeight: '700', color: '#059669' },
  empty: { color: '#9ca3af', fontSize: 15 },
});
