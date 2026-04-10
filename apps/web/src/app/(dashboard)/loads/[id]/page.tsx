'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { StatusBadge } from '../../../../components/StatusBadge';
import { api } from '../../../../lib/api';

interface Bid {
  id: string;
  carrierId: string;
  amount: number;
  estimatedPickup: string;
  estimatedDelivery: string;
  notes?: string;
  status: string;
  carrier?: { user?: { firstName?: string; lastName?: string } };
}

interface Load {
  id: string;
  status: string;
  origin: { address: string; city: string; state: string; zipCode: string };
  destination: { address: string; city: string; state: string; zipCode: string };
  equipmentType: string;
  weightLbs: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  description?: string;
  specialInstructions?: string;
  budgetMin?: number;
  budgetMax?: number;
  bids?: Bid[];
}

export default function LoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [load, setLoad] = useState<Load | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchLoad = async () => {
    try {
      const [loadRes, bidsRes] = await Promise.all([
        api.get<{ data: Load }>(`/loads/${id}`),
        api.get<{ data: Bid[] }>(`/loads/${id}/bids`),
      ]);
      setLoad(loadRes.data.data);
      setBids(bidsRes.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLoad();
  }, [id]);

  const acceptBid = async (bidId: string) => {
    setAccepting(bidId);
    try {
      await api.post(`/loads/${id}/bids/${bidId}/accept`);
      await fetchLoad();
    } finally {
      setAccepting(null);
    }
  };

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;
  if (!load) return <div className="py-16 text-center text-gray-400">Load not found.</div>;

  const fmt = (d: string) => new Date(d).toLocaleString();
  const fmtMoney = (cents: number) => `$${(cents / 100).toLocaleString()}`;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Load Detail</h1>
        <StatusBadge status={load.status} />
      </div>

      {/* Route */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-800">Route</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Origin</p>
            <p className="mt-1 font-medium text-gray-900">
              {load.origin.city}, {load.origin.state}
            </p>
            <p className="text-sm text-gray-500">
              {load.origin.address}, {load.origin.zipCode}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Destination</p>
            <p className="mt-1 font-medium text-gray-900">
              {load.destination.city}, {load.destination.state}
            </p>
            <p className="text-sm text-gray-500">
              {load.destination.address}, {load.destination.zipCode}
            </p>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-800">Freight Details</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-400">Equipment</dt>
            <dd className="font-medium text-gray-900">{load.equipmentType.replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Weight</dt>
            <dd className="font-medium text-gray-900">{load.weightLbs.toLocaleString()} lbs</dd>
          </div>
          <div>
            <dt className="text-gray-400">Pickup Window</dt>
            <dd className="font-medium text-gray-900">
              {fmt(load.pickupWindowStart)} – {fmt(load.pickupWindowEnd)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Delivery Window</dt>
            <dd className="font-medium text-gray-900">
              {fmt(load.deliveryWindowStart)} – {fmt(load.deliveryWindowEnd)}
            </dd>
          </div>
          {load.budgetMin && (
            <div>
              <dt className="text-gray-400">Budget</dt>
              <dd className="font-medium text-gray-900">
                {fmtMoney(load.budgetMin)} – {load.budgetMax ? fmtMoney(load.budgetMax) : '?'}
              </dd>
            </div>
          )}
          {load.description && (
            <div className="col-span-2">
              <dt className="text-gray-400">Description</dt>
              <dd className="text-gray-900">{load.description}</dd>
            </div>
          )}
          {load.specialInstructions && (
            <div className="col-span-2">
              <dt className="text-gray-400">Special Instructions</dt>
              <dd className="text-gray-900">{load.specialInstructions}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Bids */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-800">Bids ({bids.length})</h2>
        {bids.length === 0 ? (
          <p className="text-sm text-gray-400">
            No bids yet. Carriers will see your load and submit offers.
          </p>
        ) : (
          <div className="space-y-3">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{fmtMoney(bid.amount)}</p>
                  <p className="text-xs text-gray-500">
                    Pickup: {fmt(bid.estimatedPickup)} · Delivery: {fmt(bid.estimatedDelivery)}
                  </p>
                  {bid.notes && <p className="mt-1 text-xs text-gray-500 italic">{bid.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={bid.status} />
                  {load.status === 'AVAILABLE' && bid.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        void acceptBid(bid.id);
                      }}
                      disabled={accepting === bid.id}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {accepting === bid.id ? 'Accepting…' : 'Accept'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
