import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';
import { formatDate } from '../utils/helpers';

const AdminPanel = () => {
    const { showToast } = useToast();
    const { showConfirm } = useModal();
    const { user, refreshProfile } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching users:', error);
            showToast('Failed to load users: ' + error.message, 'error');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = async (userId, newRole) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            showToast('Error updating role: ' + error.message, 'error');
        } else {
            showToast(`Role changed to ${newRole}`, 'success');
            fetchUsers();
            // If the current user changed their own role, refresh the auth context
            // so the sidebar Admin link appears/disappears immediately.
            if (userId === user?.id) {
                await refreshProfile();
            }
        }
    };

    const handleDeactivate = (userId, name, currentStatus) => {
        const isActive = currentStatus !== 'inactive';
        const action = isActive ? 'Deactivate' : 'Reactivate';
        showConfirm(
            `${action} account for "${name}"?`,
            `${action} User`,
            async () => {
                const { error } = await supabase
                    .from('profiles')
                    .update({ status: isActive ? 'inactive' : 'active' })
                    .eq('id', userId);
                if (error) {
                    showToast('Error updating user: ' + error.message, 'error');
                } else {
                    showToast(`User ${isActive ? 'deactivated' : 'reactivated'}`, 'success');
                    fetchUsers();
                }
            }
        );
    };

    const ROLE_BADGE = {
        admin:   { bg: '#ede9fe', color: '#5b21b6', label: 'Admin' },
        manager: { bg: '#fef3c7', color: '#92400e', label: 'Manager' },
        user:    { bg: '#f1f5f9', color: '#475569', label: 'User' },
    };

    const STATUS_BADGE = {
        active:   { bg: '#dcfce7', color: '#166534' },
        inactive: { bg: '#fee2e2', color: '#991b1b' },
    };

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Admin Panel
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    Manage user roles and system access — {users.length} user{users.length !== 1 ? 's' : ''} total
                </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Users', value: users.length, color: '#6366f1' },
                    { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#8b5cf6' },
                    { label: 'Managers', value: users.filter(u => u.role === 'manager').length, color: '#f59e0b' },
                    { label: 'Active', value: users.filter(u => u.status !== 'inactive').length, color: '#10b981' },
                ].map(stat => (
                    <div key={stat.label} className="app-card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0' }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* User Table */}
            <div className="app-card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
                ) : users.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No users found.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const badge = ROLE_BADGE[u.role] || ROLE_BADGE.user;
                                    const statusBadge = STATUS_BADGE[u.status] || STATUS_BADGE.active;
                                    const isSelf = u.id === user?.id;
                                    return (
                                        <tr key={u.id} className="table-row-hover" style={{ opacity: u.status === 'inactive' ? 0.6 : 1 }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {u.avatar_url ? (
                                                        <img
                                                            src={u.avatar_url}
                                                            alt={u.full_name}
                                                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                                                            onError={e => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                                            background: 'linear-gradient(135deg,var(--color-primary-100),var(--color-primary-200))',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary-600)'
                                                        }}>
                                                            {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                                                            {u.full_name || '(No name)'}
                                                            {isSelf && (
                                                                <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: 'var(--color-primary-100)', color: 'var(--color-primary-600)', padding: '0.1rem 0.4rem', borderRadius: 99, fontWeight: 600 }}>
                                                                    You
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
                                                            {u.id.slice(0, 8)}...
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: 600,
                                                    padding: '0.2rem 0.6rem', borderRadius: 99,
                                                    background: badge.bg, color: badge.color
                                                }}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: 600,
                                                    padding: '0.2rem 0.6rem', borderRadius: 99,
                                                    background: statusBadge.bg, color: statusBadge.color
                                                }}>
                                                    {u.status || 'active'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                                {formatDate(u.created_at)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {/* Role Selector */}
                                                    <select
                                                        className="form-select"
                                                        style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem', minWidth: 110 }}
                                                        value={u.role || 'user'}
                                                        onChange={e => handleRoleChange(u.id, e.target.value)}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="manager">Manager</option>
                                                        <option value="admin">Admin</option>
                                                    </select>

                                                    {/* Deactivate / Reactivate */}
                                                    {!isSelf && (
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{
                                                                background: u.status === 'inactive' ? '#dcfce7' : '#fee2e2',
                                                                color: u.status === 'inactive' ? '#166534' : '#991b1b',
                                                                border: 'none', fontSize: '0.8125rem'
                                                            }}
                                                            onClick={() => handleDeactivate(u.id, u.full_name, u.status)}
                                                        >
                                                            {u.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
