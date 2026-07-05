import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';
import { formatDate } from '../utils/helpers';

const AdminPanel = () => {
    const { showToast } = useToast();
    const { showConfirm } = useModal();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error) setUsers(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = async (userId, newRole) => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (error) showToast('Error updating role', 'error');
        else { showToast(`Role changed to ${newRole}`, 'success'); fetchUsers(); }
    };

    const handleDeactivate = (userId, name) => {
        showConfirm(`Deactivate account for "${name}"?`, 'Deactivate User', async () => {
            const { error } = await supabase.from('profiles').update({ status: 'inactive' }).eq('id', userId);
            if (error) showToast('Error updating user', 'error');
            else { showToast('User deactivated', 'success'); fetchUsers(); }
        });
    };

    const ROLE_BADGE = {
        admin:   { bg: '#dbeafe', color: '#1e40af' },
        manager: { bg: '#f3e8ff', color: '#6b21a8' },
        user:    { bg: '#f1f5f9', color: '#475569' },
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Admin Panel</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    Manage users and system access — {users.length} users total
                </p>
            </div>

            <div className="app-card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
                ) : users.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No users found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const badge = ROLE_BADGE[u.role] || ROLE_BADGE.user;
                                    return (
                                        <tr key={u.id} className="table-row-hover">
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                                        background: 'linear-gradient(135deg,var(--color-primary-100),var(--color-primary-200))',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, color: 'var(--color-primary-600)'
                                                    }}>
                                                        {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{u.full_name || '(No name)'}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{u.id.slice(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 99, background: badge.bg, color: badge.color }}>
                                                    {u.role || 'user'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{formatDate(u.created_at)}</td>
                                            <td>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {/* Role selector */}
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
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: '#fee2e2', color: '#991b1b', border: 'none', fontSize: '0.8125rem' }}
                                                        onClick={() => handleDeactivate(u.id, u.full_name)}
                                                    >
                                                        Deactivate
                                                    </button>
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
