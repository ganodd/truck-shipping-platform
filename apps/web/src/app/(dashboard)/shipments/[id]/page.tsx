'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { StatusBadge } from '../../../../components/StatusBadge';
import { api } from '../../../../lib/api';

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
  carrier: {
    user?: { firstName?: string; lastName?: string; phone?: string };
  };
  events?: ShipmentEvent[];
}

const STATUS_ORDER = ['PENDING_PICKUP', 'IN_TRANSIT', 'DELIVERED'];

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get<{ data: Shipment }>(`/shipments/${id}`);
        setShipment(data.data);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
    const interval = setInterval(() => void fetch(), 30_000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;
  if (!shipment) return <div className="py-16 text-center text-gray-400">Shipment not found.</div>;

  const fmtMoney = (cents: number) => `$${(cents / 100).toLocaleString()}`;
  const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : '—');

  const currentStep = STATUS_ORDER.indexOf(shipment.status);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Shipment Tracking</h1>
        <StatusBadge status={shipment.status} />
      </div>

      {/* Progress bar */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          {STATUS_ORDER.map((step, i) => (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                {i + 1}
              </div>
              <p
                className={`mt-1 text-xs ${i <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
              >
                {step.replace(/_/g, ' ')}
              </p>
              {i < STATUS_ORDER.length - 1 && (
                <div
                  className={`absolute h-0.5 w-1/3 ${i < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Route + Carrier */}
      <div className="grid grid-cols-2 gap-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-800">Route</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">From:</span>{' '}
              <span className="text-gray-900">
                {shipment.load?.origin?.city}, {shipment.load?.origin?.state}
              </span>
            </div>
            <div>
              <span className="text-gray-400">To:</span>{' '}
              <span className="text-gray-900">
                {shipment.load?.destination?.city}, {shipment.load?.destination?.state}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Equipment:</span>{' '}
              <span className="text-gray-900">
                {shipment.load?.equipmentType?.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Weight:</span>{' '}
              <span className="text-gray-900">
                {shipment.load?.weightLbs?.toLocaleString()} lbs
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-800">Carrier & Financials</h2>
          <div className="space-y-2 text-sm">
            {shipment.carrier?.user && (
              <div>
                <span className="text-gray-400">Driver:</span>{' '}
                <span className="text-gray-900">
                  {shipment.carrier.user.firstName} {shipment.carrier.user.lastName}
                </span>
              </div>
            )}
            {shipment.carrier?.user?.phone && (
              <div>
                <span className="text-gray-400">Phone:</span>{' '}
                <a
                  href={`tel:${shipment.carrier.user.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {shipment.carrier.user.phone}
                </a>
              </div>
            )}
            <div>
              <span className="text-gray-400">Agreed Price:</span>{' '}
              <span className="font-semibold text-gray-900">{fmtMoney(shipment.agreedPrice)}</span>
            </div>
            <div>
              <span className="text-gray-400">Picked Up:</span>{' '}
              <span className="text-gray-900">{fmt(shipment.pickedUpAt)}</span>
            </div>
            <div>
              <span className="text-gray-400">Delivered:</span>{' '}
              <span className="text-gray-900">{fmt(shipment.deliveredAt)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Event Timeline */}
      {shipment.events && shipment.events.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-800">Event Timeline</h2>
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {shipment.events.map((ev) => (
              <li key={ev.id} className="ml-4">
                <div className="absolute -left-1.5 h-3 w-3 rounded-full border border-white bg-blue-400" />
                <div className="flex items-start gap-3">
                  <div>
                    <StatusBadge status={ev.status} />
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(ev.timestamp).toLocaleString()}
                    </p>
                    {ev.latitude && (
                      <p className="text-xs text-gray-400">
                        GPS: {ev.latitude.toFixed(4)}, {ev.longitude?.toFixed(4)}
                      </p>
                    )}
                    {ev.notes && <p className="text-xs text-gray-500 italic">{ev.notes}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
