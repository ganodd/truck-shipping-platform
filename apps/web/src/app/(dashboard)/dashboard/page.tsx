'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { StatusBadge } from '../../../components/StatusBadge';
import { api } from '../../../lib/api';

interface Load {
  id: string;
  status: string;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  equipmentType: string;
  weightLbs: number;
  pickupWindowStart: string;
  agreedPrice?: number;
}

interface Shipment {
  id: string;
  status: string;
  agreedPrice: number;
  load: { origin: { city: string; state: string }; destination: { city: string; state: string } };
  deliveredAt?: string;
}

export default function DashboardPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [loadsRes, shipmentsRes] = await Promise.all([
          api.get<{ data: { data: Load[] } }>('/loads'),
          api.get<{ data: { data: Shipment[] } }>('/shipments'),
        ]);
        setLoads(loadsRes.data.data.data ?? []);
        setShipments(shipmentsRes.data.data.data ?? []);
      } catch {
        // silently handle — user sees empty state
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading…</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/loads/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Post Load
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'My Loads', value: loads.length },
          {
            label: 'Active Shipments',
            value: shipments.filter((s) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED')
              .length,
          },
          { label: 'Delivered', value: shipments.filter((s) => s.status === 'DELIVERED').length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* My Loads */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">My Loads</h2>
        {loads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
            <p className="text-gray-400">No loads yet.</p>
            <Link
              href="/loads/new"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Post your first load →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Route</th>
                  <th className="px-4 py-3 text-left">Equipment</th>
                  <th className="px-4 py-3 text-left">Weight</th>
                  <th className="px-4 py-3 text-left">Pickup</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loads.map((load) => (
                  <tr key={load.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {load.origin.city}, {load.origin.state} → {load.destination.city},{' '}
                      {load.destination.state}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {load.equipmentType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {load.weightLbs.toLocaleString()} lbs
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(load.pickupWindowStart).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={load.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/loads/${load.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Active Shipments */}
      {shipments.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Active Shipments</h2>
          <div className="grid gap-4">
            {shipments
              .filter((s) => s.status !== 'CANCELLED')
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {s.load?.origin?.city} → {s.load?.destination?.city}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${(s.agreedPrice / 100).toLocaleString()}
                      {s.deliveredAt &&
                        ` · Delivered ${new Date(s.deliveredAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={s.status} />
                    <Link
                      href={`/shipments/${s.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Track →
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
