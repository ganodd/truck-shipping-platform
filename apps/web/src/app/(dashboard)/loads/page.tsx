'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { StatusBadge } from '../../../components/StatusBadge';
import { api } from '../../../lib/api';

interface Load {
  id: string;
  status: string;
  equipmentType: string;
  weightLbs: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  budgetMin?: number;
  budgetMax?: number;
}

export default function LoadBoardPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { status: 'AVAILABLE', limit: '50' };
        if (equipment) params.equipmentType = equipment;
        const { data } = await api.get<{ data: Load[] }>('/loads', { params });
        setLoads(data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [equipment]);

  const fmt = (d: string) => new Date(d).toLocaleDateString();
  const fmtMoney = (cents: number) => `$${(cents / 100).toLocaleString()}`;

  const EQUIPMENT_TYPES = [
    '',
    'DRY_VAN',
    'FLATBED',
    'REEFER',
    'STEP_DECK',
    'LOWBOY',
    'TANKER',
    'POWER_ONLY',
    'BOX_TRUCK',
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Load Board</h1>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {EQUIPMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t ? t.replace(/_/g, ' ') : 'All Equipment'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading loads…</div>
      ) : loads.length === 0 ? (
        <div className="py-16 text-center text-gray-400">No available loads found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Route</th>
                <th className="px-4 py-3 text-left">Equipment</th>
                <th className="px-4 py-3 text-left">Weight</th>
                <th className="px-4 py-3 text-left">Pickup</th>
                <th className="px-4 py-3 text-left">Budget</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loads.map((load) => (
                <tr key={load.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {load.origin.city}, {load.origin.state} → {load.destination.city},{' '}
                    {load.destination.state}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {load.equipmentType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{load.weightLbs.toLocaleString()} lbs</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(load.pickupWindowStart)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {load.budgetMin
                      ? `${fmtMoney(load.budgetMin)}${load.budgetMax ? ` – ${fmtMoney(load.budgetMax)}` : '+'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={load.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/loads/${load.id}`}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      View & Bid
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
