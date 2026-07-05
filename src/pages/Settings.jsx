import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

const Settings = () => {
    const { user, profile } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { showToast } = useToast();

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [saving, setSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPw, setChangingPw] = useState(false);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (!fullName.trim()) { showToast('Name cannot be empty', 'error'); return; }
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName.trim() })
            .eq('id', user?.id);
        if (error) showToast('Error saving profile', 'error');
        else showToast('Profile updated!', 'success');
        setSaving(false);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
        if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
        setChangingPw(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) showToast(error.message, 'error');
        else {
            showToast('Password updated!', 'success');
            setNewPassword(''); setConfirmPassword(''); setCurrentPassword('');
        }
        setChangingPw(false);
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Settings</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Manage your account and preferences</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>

                {/* Profile */}
                <div className="app-card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Profile</h2>

                    <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                            background: 'linear-gradient(135deg,var(--color-primary-500),var(--color-primary-700))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: '1.25rem'
                        }}>
                            {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{profile?.full_name || 'User'}</p>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: 0 }}>{user?.email}</p>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 99,
                                background: profile?.role === 'admin' ? '#dbeafe' : '#f1f5f9',
                                color: profile?.role === 'admin' ? '#1e40af' : '#475569' }}>
                                {(profile?.role || 'user').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSave}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" value={user?.email || ''} disabled style={{ background: 'var(--bg-hover)', cursor: 'not-allowed' }} />
                            <p className="form-hint">Email cannot be changed here</p>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>

                {/* Password */}
                <div className="app-card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Change Password</h2>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input type="password" className="form-input" value={newPassword}
                                onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input type="password" className="form-input" value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={changingPw}>
                            {changingPw ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>

                {/* Appearance */}
                <div className="app-card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Appearance</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Dark Mode</p>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: 0 }}>
                                Currently: {isDarkMode ? 'Dark' : 'Light'}
                            </p>
                        </div>
                        <button onClick={toggleTheme} className="btn btn-secondary btn-sm">
                            {isDarkMode ? '☀ Light Mode' : '🌙 Dark Mode'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
