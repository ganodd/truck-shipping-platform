'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { StatusBadge } from '../../../components/StatusBadge';
import { api } from '../../../lib/api';

interface Bid {
  id: string;
  amount: number;
  status: string;
  estimatedPickup: string;
  estimatedDelivery: string;
  notes?: string;
  load: {
    id: string;
    origin: { city: string; state: string };
    destination: { city: string; state: string };
    equipmentType: string;
  };
  createdAt: string;
}

export default function MyBidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const fetchBids = async () => {
    try {
      const { data } = await api.get<{ data: Bid[] }>('/bids/my');
      setBids(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBids();
  }, []);

  const withdraw = async (bidId: string) => {
    setWithdrawing(bidId);
    try {
      await api.patch(`/bids/${bidId}/withdraw`);
      await fetchBids();
    } finally {
      setWithdrawing(null);
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString();
  const fmtMoney = (cents: number) => `$${(cents / 100).toLocaleString()}`;

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Bids</h1>

      {bids.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">You haven&apos;t placed any bids yet.</p>
          <Link
            href="/loads"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Browse Load Board
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className="rounded-xl border border-gray-200 bg-white p-5 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">
                    {bid.load.origin.city}, {bid.load.origin.state} → {bid.load.destination.city},{' '}
                    {bid.load.destination.state}
                  </p>
                  <StatusBadge status={bid.status} />
                </div>
                <p className="text-sm text-gray-500">
                  {bid.load.equipmentType.replace(/_/g, ' ')} · Pickup: {fmt(bid.estimatedPickup)} ·
                  Delivery: {fmt(bid.estimatedDelivery)}
                </p>
                {bid.notes && (
                  <p className="mt-1 text-xs text-gray-400 italic">&ldquo;{bid.notes}&rdquo;</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <p className="text-lg font-bold text-gray-900">{fmtMoney(bid.amount)}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/loads/${bid.load.id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View Load
                  </Link>
                  {bid.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        void withdraw(bid.id);
                      }}
                      disabled={withdrawing === bid.id}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      {withdrawing === bid.id ? 'Withdrawing…' : 'Withdraw'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
