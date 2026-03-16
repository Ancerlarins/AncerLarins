'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetAdminListQuery,
  useGetAdminUsersQuery,
  usePromoteToAdminMutation,
  useDemoteAdminMutation,
} from '@/store/api/adminApi';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminTeamPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchPage, setUserSearchPage] = useState(1);
  const [promoteModal, setPromoteModal] = useState<{ id: string; name: string } | null>(null);
  const [demoteModal, setDemoteModal] = useState<{ id: string; name: string } | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const { data: adminData, isLoading: adminsLoading } = useGetAdminListQuery({ page }, { skip: !isSuperAdmin });
  const { data: usersData, isLoading: usersLoading } = useGetAdminUsersQuery(
    { role: 'user', page: userSearchPage, per_page: 10, search: userSearch || undefined },
    { skip: !showAddModal || !isSuperAdmin }
  );
  const [promoteToAdmin, { isLoading: promoting }] = usePromoteToAdminMutation();
  const [demoteAdmin, { isLoading: demoting }] = useDemoteAdminMutation();

  if (currentUser && !isSuperAdmin) {
    router.push('/admin');
    return null;
  }

  const admins = adminData?.data || [];
  const searchResults = usersData?.data || [];
  const meta = adminData?.meta;

  const adminCount = admins.filter(a => a.role === 'admin').length;
  const superAdminCount = admins.filter(a => a.role === 'super_admin').length;

  const handlePromote = async () => {
    if (!promoteModal) return;
    try {
      await promoteToAdmin({ user_id: promoteModal.id }).unwrap();
      setPromoteModal(null);
      setShowAddModal(false);
      setUserSearch('');
    } catch { /* handled by RTK */ }
  };

  const handleDemote = async () => {
    if (!demoteModal) return;
    try {
      await demoteAdmin({ user_id: demoteModal.id }).unwrap();
      setDemoteModal(null);
    } catch { /* handled by RTK */ }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Team</h1>
            </div>
            <p className="text-white/60 text-sm">
              Manage who has admin access to the platform
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary text-sm font-semibold hover:bg-white/90 transition-colors shadow-lg shadow-black/10 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            Add Admin
          </button>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-4 w-28 h-28 rounded-full bg-white/5" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{(meta?.total ?? admins.length).toLocaleString()}</p>
          <p className="text-xs text-text-muted mt-0.5">Total Admins</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{superAdminCount}</p>
          <p className="text-xs text-text-muted mt-0.5">Super Admins</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent-dark">{adminCount}</p>
          <p className="text-xs text-text-muted mt-0.5">Admins</p>
        </div>
      </div>

      {/* Admin List */}
      {adminsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-border/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border/50 rounded w-1/3" />
                  <div className="h-3 bg-border/50 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-text-primary mb-1">No team members yet</h3>
          <p className="text-sm text-text-muted mb-4">Click &quot;Add Admin&quot; to promote a user to admin.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add First Admin
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => {
            const isSelf = admin.id === currentUser?.id;
            const isSuperAdminRole = admin.role === 'super_admin';

            return (
              <div
                key={admin.id}
                className={`bg-surface border rounded-xl p-4 sm:p-5 transition-colors ${
                  isSuperAdminRole ? 'border-primary/20 bg-primary/[0.02]' : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {admin.avatar_url ? (
                      <Image src={admin.avatar_url} alt={admin.full_name} width={48} height={48} className="w-12 h-12 rounded-full object-cover ring-2 ring-border" unoptimized />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ring-2 ${
                        isSuperAdminRole
                          ? 'bg-primary/10 text-primary ring-primary/20'
                          : 'bg-accent/10 text-accent-dark ring-accent/20'
                      }`}>
                        {admin.first_name.charAt(0)}
                      </div>
                    )}
                    {/* Online indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                      admin.status === 'active' ? 'bg-success' : 'bg-border'
                    }`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-text-primary">{admin.full_name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isSuperAdminRole
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent-dark/10 text-accent-dark'
                      }`}>
                        {isSuperAdminRole ? 'Super Admin' : 'Admin'}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-success/10 text-success">
                          You
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      {admin.email && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          {admin.email}
                        </span>
                      )}
                      {admin.phone && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                          </svg>
                          {admin.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        Joined {formatRelativeTime(admin.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    {isSuperAdminRole ? (
                      <div className="flex items-center gap-1.5 text-xs text-primary/60 bg-primary/5 px-3 py-1.5 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Protected
                      </div>
                    ) : !isSelf ? (
                      <button
                        onClick={() => setDemoteModal({ id: admin.id, name: admin.full_name })}
                        className="flex items-center gap-1.5 text-xs text-error bg-error/5 hover:bg-error/10 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">Page {meta.current_page} of {meta.last_page} ({meta.total} total)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-background transition-colors">Previous</button>
            <button onClick={() => setPage(Math.min(meta.last_page, page + 1))} disabled={page === meta.last_page} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-background transition-colors">Next</button>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowAddModal(false); setUserSearch(''); }}>
          <div className="bg-surface rounded-2xl max-w-lg w-full border border-border max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-text-primary text-lg">Add New Admin</h3>
                <button
                  onClick={() => { setShowAddModal(false); setUserSearch(''); }}
                  className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-border/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-text-muted mb-4">Search for a user to promote to admin role.</p>

              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserSearchPage(1); }}
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              {usersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-full bg-border/50" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-border/50 rounded w-1/3" />
                        <div className="h-3 bg-border/50 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-muted">
                    {userSearch ? 'No users found matching your search.' : 'Start typing to search for users.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-background transition-colors group">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <Image src={u.avatar_url} alt={u.full_name} width={40} height={40} className="w-10 h-10 rounded-full object-cover ring-1 ring-border" unoptimized />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent/10 ring-1 ring-accent/20 flex items-center justify-center text-accent-dark font-bold">
                            {u.first_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-medium text-sm">{u.full_name}</p>
                          <p className="text-xs text-text-muted">{u.phone || u.email || 'No contact info'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPromoteModal({ id: u.id, name: u.full_name })}
                        className="text-xs bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors opacity-80 group-hover:opacity-100"
                      >
                        Make Admin
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Promote Confirmation Modal */}
      {promoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-md w-full border border-border shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-bold text-text-primary text-center text-lg mb-1">Promote to Admin</h3>
            <p className="text-sm text-text-secondary text-center mb-6">
              <strong>{promoteModal.name}</strong> will get full access to the admin dashboard including property moderation, user management, and reports.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPromoteModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-background transition-colors">Cancel</button>
              <button onClick={handlePromote} disabled={promoting} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors">
                {promoting ? 'Promoting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Admin Modal */}
      {demoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-md w-full border border-border shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="font-bold text-text-primary text-center text-lg mb-1">Remove Admin</h3>
            <p className="text-sm text-text-secondary text-center mb-2">
              Are you sure you want to remove <strong>{demoteModal.name}</strong> from the admin team?
            </p>
            <div className="bg-error/5 border border-error/10 rounded-lg p-3 mb-6">
              <p className="text-xs text-error/80 text-center">This will revoke all admin privileges and terminate their active sessions immediately.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDemoteModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-background transition-colors">Cancel</button>
              <button onClick={handleDemote} disabled={demoting} className="flex-1 px-4 py-2.5 rounded-xl bg-error text-white text-sm font-semibold disabled:opacity-50 hover:bg-error/90 transition-colors">
                {demoting ? 'Removing...' : 'Remove Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
