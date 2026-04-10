import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { api } from '../../../src/lib/api';

interface Bid {
  id: string;
  amount: number;
  status: string;
  carrier: { user: { firstName: string; lastName: string } };
}

interface Load {
  id: string;
  status: string;
  equipmentType: string;
  weightLbs: number;
  pickupWindowStart?: string;
  deliveryWindowEnd?: string;
  budgetCents?: number;
  notes?: string;
  origin: { city: string; state: string; address: string };
  destination: { city: string; state: string; address: string };
  bids?: Bid[];
}

interface BidForm {
  amount: string;
  estimatedPickup: string;
  estimatedDelivery: string;
  notes: string;
}

export default function LoadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [load, setLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);
  const [form, setForm] = useState<BidForm>({
    amount: '',
    estimatedPickup: '',
    estimatedDelivery: '',
    notes: '',
  });

  const fetchLoad = async () => {
    try {
      const res = await api.get<{ data: Load }>(`/loads/${id}`);
      setLoad(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLoad();
  }, [id]);

  const submitBid = async () => {
    if (!form.amount) {
      setBidError('Bid amount is required.');
      return;
    }
    setSubmitting(true);
    setBidError('');
    try {
      await api.post('/bids', {
        loadId: id,
        amount: Math.round(parseFloat(form.amount) * 100),
        estimatedPickup: form.estimatedPickup || undefined,
        estimatedDelivery: form.estimatedDelivery || undefined,
        notes: form.notes || undefined,
      });
      setBidSuccess(true);
      setShowBidForm(false);
      void fetchLoad();
    } catch (err: unknown) {
      setBidError(err instanceof Error ? err.message : 'Failed to submit bid.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!load) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Load not found.</Text>
      </View>
    );
  }

  const canBid = load.status === 'AVAILABLE';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <Text style={styles.routeText}>
            {load.origin.city}, {load.origin.state}
          </Text>
          <Text style={styles.arrow}>↓</Text>
          <Text style={styles.routeText}>
            {load.destination.city}, {load.destination.state}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Row label="Equipment" value={load.equipmentType.replace(/_/g, ' ')} />
          <Row label="Weight" value={`${load.weightLbs.toLocaleString()} lbs`} />
          {load.budgetCents != null && (
            <Row label="Budget" value={`$${(load.budgetCents / 100).toLocaleString()}`} />
          )}
          {load.pickupWindowStart && (
            <Row label="Pickup Window" value={new Date(load.pickupWindowStart).toLocaleString()} />
          )}
          {load.deliveryWindowEnd && (
            <Row label="Delivery By" value={new Date(load.deliveryWindowEnd).toLocaleString()} />
          )}
          {load.notes && <Row label="Notes" value={load.notes} />}
        </View>

        {/* Bid success */}
        {bidSuccess && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Bid submitted successfully!</Text>
          </View>
        )}

        {/* Bid form */}
        {canBid && !bidSuccess && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Place a Bid</Text>
            {!showBidForm ? (
              <Pressable style={styles.btn} onPress={() => setShowBidForm(true)}>
                <Text style={styles.btnText}>Place Bid</Text>
              </Pressable>
            ) : (
              <>
                {bidError ? <Text style={styles.error}>{bidError}</Text> : null}
                <TextInput
                  style={styles.input}
                  placeholder="Bid amount ($)"
                  keyboardType="decimal-pad"
                  value={form.amount}
                  onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Est. pickup date (YYYY-MM-DD)"
                  value={form.estimatedPickup}
                  onChangeText={(v) => setForm((f) => ({ ...f, estimatedPickup: v }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Est. delivery date (YYYY-MM-DD)"
                  value={form.estimatedDelivery}
                  onChangeText={(v) => setForm((f) => ({ ...f, estimatedDelivery: v }))}
                />
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Notes (optional)"
                  multiline
                  value={form.notes}
                  onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                />
                <View style={styles.row}>
                  <Pressable
                    style={[styles.btn, { flex: 1, marginRight: 8 }]}
                    onPress={() => void submitBid()}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>Submit Bid</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.btnOutline, { flex: 1 }]}
                    onPress={() => setShowBidForm(false)}
                  >
                    <Text style={styles.btnOutlineText}>Cancel</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#9ca3af', fontSize: 15 },
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
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  routeText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  arrow: { fontSize: 18, color: '#9ca3af', marginVertical: 4 },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLabel: { fontSize: 14, color: '#6b7280' },
  rowValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  row: { flexDirection: 'row' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  btn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnOutlineText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 13,
  },
  successBox: { backgroundColor: '#d1fae5', borderRadius: 10, padding: 14 },
  successText: { color: '#065f46', fontWeight: '600', textAlign: 'center' },
});
