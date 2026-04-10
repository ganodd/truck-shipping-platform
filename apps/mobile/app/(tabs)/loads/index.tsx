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

interface Load {
  id: string;
  status: string;
  equipmentType: string;
  weightLbs: number;
  pickupWindowStart?: string;
  budgetCents?: number;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  _count: { bids: number };
}

interface LoadsResponse {
  data: Load[];
  meta: { total: number; hasNextPage: boolean };
}

const EQUIPMENT_TYPES = ['', 'DRY_VAN', 'FLATBED', 'REFRIGERATED', 'TANKER', 'STEP_DECK'];

export default function LoadBoardScreen() {
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState('');

  const fetchLoads = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams({ status: 'AVAILABLE', limit: '30' });
        if (equipmentFilter) params.set('equipmentType', equipmentFilter);
        const res = await api.get<LoadsResponse>(`/loads?${params}`);
        setLoads(res.data);
      } catch {
        // silently fail on refresh
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [equipmentFilter],
  );

  useEffect(() => {
    void fetchLoads();
  }, [fetchLoads]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchLoads(true);
  };

  const renderLoad = ({ item }: { item: Load }) => (
    <Pressable style={styles.card} onPress={() => router.push(`/(tabs)/loads/${item.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.route}>
          {item.origin.city}, {item.origin.state} → {item.destination.city},{' '}
          {item.destination.state}
        </Text>
        <Text style={styles.bids}>{item._count.bids} bids</Text>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.chip}>{item.equipmentType.replace(/_/g, ' ')}</Text>
        <Text style={styles.chip}>{item.weightLbs.toLocaleString()} lbs</Text>
        {item.budgetCents != null && (
          <Text style={styles.chipGreen}>${(item.budgetCents / 100).toLocaleString()}</Text>
        )}
      </View>
      {item.pickupWindowStart && (
        <Text style={styles.date}>
          Pickup: {new Date(item.pickupWindowStart).toLocaleDateString()}
        </Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Equipment filter */}
      <FlatList
        horizontal
        data={EQUIPMENT_TYPES}
        keyExtractor={(t) => t}
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterChip, equipmentFilter === item && styles.filterChipActive]}
            onPress={() => setEquipmentFilter(item)}
          >
            <Text style={[styles.filterText, equipmentFilter === item && styles.filterTextActive]}>
              {item || 'All'}
            </Text>
          </Pressable>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={loads}
          keyExtractor={(l) => l.id}
          renderItem={renderLoad}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No available loads matching your criteria.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  filterBar: { paddingHorizontal: 12, paddingVertical: 10, maxHeight: 54, flexGrow: 0 },
  filterChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText: { fontSize: 13, color: '#374151' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 12, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  route: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827', marginRight: 8 },
  bids: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chipGreen: {
    fontSize: 12,
    color: '#065f46',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontWeight: '600',
  },
  date: { fontSize: 12, color: '#6b7280' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
});
