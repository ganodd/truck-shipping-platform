'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { api } from '../../../../lib/api';

const EQUIPMENT_TYPES = [
  'DRY_VAN',
  'FLATBED',
  'REEFER',
  'STEP_DECK',
  'LOWBOY',
  'TANKER',
  'POWER_ONLY',
  'BOX_TRUCK',
];

interface LocationInput {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
}

const emptyLocation = (): LocationInput => ({
  address: '',
  city: '',
  state: '',
  zipCode: '',
  latitude: '',
  longitude: '',
});

export default function NewLoadPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState<LocationInput>(emptyLocation());
  const [destination, setDestination] = useState<LocationInput>(emptyLocation());
  const [form, setForm] = useState({
    equipmentType: 'DRY_VAN',
    weightLbs: '',
    pickupWindowStart: '',
    pickupWindowEnd: '',
    deliveryWindowStart: '',
    deliveryWindowEnd: '',
    description: '',
    specialInstructions: '',
    budgetMin: '',
    budgetMax: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setLoc =
    (setter: React.Dispatch<React.SetStateAction<LocationInput>>, field: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setter((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      origin: {
        ...origin,
        latitude: parseFloat(origin.latitude),
        longitude: parseFloat(origin.longitude),
      },
      destination: {
        ...destination,
        latitude: parseFloat(destination.latitude),
        longitude: parseFloat(destination.longitude),
      },
      equipmentType: form.equipmentType,
      weightLbs: parseFloat(form.weightLbs),
      pickupWindowStart: new Date(form.pickupWindowStart).toISOString(),
      pickupWindowEnd: new Date(form.pickupWindowEnd).toISOString(),
      deliveryWindowStart: new Date(form.deliveryWindowStart).toISOString(),
      deliveryWindowEnd: new Date(form.deliveryWindowEnd).toISOString(),
      description: form.description || undefined,
      specialInstructions: form.specialInstructions || undefined,
      budgetMin: form.budgetMin ? Math.round(parseFloat(form.budgetMin) * 100) : undefined,
      budgetMax: form.budgetMax ? Math.round(parseFloat(form.budgetMax) * 100) : undefined,
    };

    try {
      const { data } = await api.post<{ data: { id: string } }>('/loads', payload);
      router.push(`/loads/${data.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg ?? 'Failed to post load. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Post a Load</h1>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-6"
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Origin */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-800">Origin</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
              <input
                required
                value={origin.address}
                onChange={setLoc(setOrigin, 'address')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input
                required
                value={origin.city}
                onChange={setLoc(setOrigin, 'city')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                State (2-letter)
              </label>
              <input
                required
                maxLength={2}
                value={origin.state}
                onChange={setLoc(setOrigin, 'state')}
                className={inputCls}
                placeholder="TX"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ZIP Code</label>
              <input
                required
                value={origin.zipCode}
                onChange={setLoc(setOrigin, 'zipCode')}
                className={inputCls}
                placeholder="75001"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={origin.latitude}
                  onChange={setLoc(setOrigin, 'latitude')}
                  className={inputCls}
                  placeholder="32.78"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={origin.longitude}
                  onChange={setLoc(setOrigin, 'longitude')}
                  className={inputCls}
                  placeholder="-96.80"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Destination */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-800">Destination</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
              <input
                required
                value={destination.address}
                onChange={setLoc(setDestination, 'address')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input
                required
                value={destination.city}
                onChange={setLoc(setDestination, 'city')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                State (2-letter)
              </label>
              <input
                required
                maxLength={2}
                value={destination.state}
                onChange={setLoc(setDestination, 'state')}
                className={inputCls}
                placeholder="CA"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ZIP Code</label>
              <input
                required
                value={destination.zipCode}
                onChange={setLoc(setDestination, 'zipCode')}
                className={inputCls}
                placeholder="90001"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={destination.latitude}
                  onChange={setLoc(setDestination, 'latitude')}
                  className={inputCls}
                  placeholder="34.05"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={destination.longitude}
                  onChange={setLoc(setDestination, 'longitude')}
                  className={inputCls}
                  placeholder="-118.24"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Freight Details */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-800">Freight Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Equipment Type</label>
              <select
                value={form.equipmentType}
                onChange={setField('equipmentType')}
                className={inputCls}
              >
                {EQUIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Weight (lbs)</label>
              <input
                required
                type="number"
                min="1"
                max="80000"
                value={form.weightLbs}
                onChange={setField('weightLbs')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Pickup Window Start
              </label>
              <input
                required
                type="datetime-local"
                value={form.pickupWindowStart}
                onChange={setField('pickupWindowStart')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Pickup Window End
              </label>
              <input
                required
                type="datetime-local"
                value={form.pickupWindowEnd}
                onChange={setField('pickupWindowEnd')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Delivery Window Start
              </label>
              <input
                required
                type="datetime-local"
                value={form.deliveryWindowStart}
                onChange={setField('deliveryWindowStart')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Delivery Window End
              </label>
              <input
                required
                type="datetime-local"
                value={form.deliveryWindowEnd}
                onChange={setField('deliveryWindowEnd')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Budget Min ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budgetMin}
                onChange={setField('budgetMin')}
                className={inputCls}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Budget Max ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budgetMax}
                onChange={setField('budgetMax')}
                className={inputCls}
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={setField('description')}
                className={inputCls}
                placeholder="Optional details about the freight"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Special Instructions
              </label>
              <textarea
                rows={2}
                value={form.specialInstructions}
                onChange={setField('specialInstructions')}
                className={inputCls}
                placeholder="Optional"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Posting…' : 'Post Load'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
