const COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  AVAILABLE: 'bg-green-100 text-green-700',
  MATCHED: 'bg-blue-100 text-blue-700',
  BOOKED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING_PICKUP: 'bg-yellow-100 text-yellow-700',
  PICKED_UP: 'bg-blue-100 text-blue-700',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-gray-100 text-gray-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] ?? 'bg-gray-100 text-gray-700';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
