'use client';

import { useEffect, useState } from 'react';

import { api } from '../../../lib/api';

interface PlatformStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  loadsByStatus: Record<string, number>;
  shipmentsByStatus: Record<string, number>;
  totalRevenueCents: number;
  totalBids: number;
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .get<{ data: PlatformStats }>('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;
  if (!stats) return <div className="py-16 text-center text-gray-400">Failed to load stats.</div>;

  const fmtMoney = (cents: number) => `$${(cents / 100).toLocaleString()}`;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>

      {/* User KPIs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Users</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="Total Users" value={stats.totalUsers} />
          <KpiCard label="Shippers" value={stats.usersByRole['SHIPPER'] ?? 0} />
          <KpiCard label="Carriers" value={stats.usersByRole['CARRIER'] ?? 0} />
          <KpiCard label="Admins" value={stats.usersByRole['ADMIN'] ?? 0} />
        </div>
      </section>

      {/* Load KPIs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Loads</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(stats.loadsByStatus).map(([status, count]) => (
            <KpiCard key={status} label={status.replace(/_/g, ' ')} value={count as number} />
          ))}
          <KpiCard label="Total Bids" value={stats.totalBids} />
        </div>
      </section>

      {/* Shipment KPIs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Shipments & Revenue
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(stats.shipmentsByStatus).map(([status, count]) => (
            <KpiCard key={status} label={status.replace(/_/g, ' ')} value={count as number} />
          ))}
          <KpiCard label="Total Revenue" value={fmtMoney(stats.totalRevenueCents)} />
        </div>
      </section>
    </div>
  );
}
