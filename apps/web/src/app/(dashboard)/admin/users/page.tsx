'use client';

import { useEffect, useState } from 'react';

import { StatusBadge } from '../../../../components/StatusBadge';
import { api } from '../../../../lib/api';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  role: string;
  kycStatus: string;
  emailVerified: boolean;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (kycFilter) params.set('kyc', kycFilter);
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await api.get<{ data: AdminUser[]; meta: Meta }>(`/admin/users?${params}`);
      setUsers(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers(page);
  }, [page, kycFilter, roleFilter]);

  const handleKyc = async (userId: string, action: 'approve' | 'reject') => {
    setActionMsg('');
    try {
      await api.patch(`/admin/users/${userId}/kyc/${action}`);
      setActionMsg(`KYC ${action}d successfully.`);
      void fetchUsers(page);
    } catch {
      setActionMsg('Action failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          <option value="SHIPPER">Shipper</option>
          <option value="CARRIER">Carrier</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={kycFilter}
          onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All KYC Statuses</option>
          <option value="NOT_SUBMITTED">Not Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {actionMsg && (
        <p className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">{actionMsg}</p>
      )}

      {loading ? (
        <div className="py-10 text-center text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">KYC</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.firstName} {u.lastName}
                      {u.companyName && (
                        <span className="ml-1 text-xs text-gray-400">({u.companyName})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.kycStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {u.kycStatus !== 'APPROVED' && (
                        <button
                          onClick={() => void handleKyc(u.id, 'approve')}
                          className="mr-2 rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-200"
                        >
                          Approve KYC
                        </button>
                      )}
                      {u.kycStatus !== 'REJECTED' && (
                        <button
                          onClick={() => void handleKyc(u.id, 'reject')}
                          className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                        >
                          Reject KYC
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {meta.total} user{meta.total !== 1 ? 's' : ''} — page {meta.page} of{' '}
                {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!meta.hasPrevPage}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
