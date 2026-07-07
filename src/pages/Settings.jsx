import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

const Settings = () => {
    const { user, profile, updateProfile, changePassword } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { showToast } = useToast();

    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [saving, setSaving] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPw, setChangingPw] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarFileRef = useRef(null);

    // Sync profile name and avatar when profile loads
    useEffect(() => {
        if (profile?.full_name) {
            setFullName(profile.full_name);
        }
        if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url);
        }
    }, [profile]);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (!fullName.trim()) { showToast('Name cannot be empty', 'error'); return; }
        setSaving(true);
        const result = await updateProfile({
            full_name: fullName.trim(),
            avatar_url: avatarUrl.trim() || null
        });
        if (!result.success) {
            showToast(result.error || 'Error saving profile', 'error');
        } else {
            showToast('Profile updated!', 'success');
        }
        setSaving(false);
    };

    const uploadAvatar = async (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setAvatarUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `avatars/${user.id}-${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from('product-images')
                .upload(path, file, { upsert: true });
            if (upErr) throw upErr;
            const { data } = supabase.storage.from('product-images').getPublicUrl(path);
            setAvatarUrl(data.publicUrl);
            showToast('Photo uploaded! Click Save Profile to apply.', 'success');
        } catch (err) {
            showToast(err.message || 'Upload failed', 'error');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
        if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
        setChangingPw(true);
        const result = await changePassword(newPassword);
        if (!result.success) {
            showToast(result.error || 'Password update failed', 'error');
        } else {
            showToast('Password updated!', 'success');
            setNewPassword(''); 
            setConfirmPassword('');
        }
        setChangingPw(false);
    };

    const handleSeedDemoData = async () => {
        setSeeding(true);
        try {
            // ── 1. Seed categories (idempotent) ──────────────────────────
            const categorySeed = [
                { name: 'Electronics',     description: 'Electronic devices and accessories',    color: '#3B82F6', icon: 'cpu' },
                { name: 'Clothing',        description: 'Apparel and fashion items',             color: '#8B5CF6', icon: 'shirt' },
                { name: 'Food & Beverages',description: 'Consumable goods and drinks',           color: '#10B981', icon: 'coffee' },
                { name: 'Office Supplies', description: 'Stationery and office equipment',       color: '#F59E0B', icon: 'briefcase' },
                { name: 'Furniture',       description: 'Office and home furniture',             color: '#EF4444', icon: 'armchair' },
                { name: 'Tools',           description: 'Hardware and DIY tools',                color: '#6B7280', icon: 'wrench' },
                { name: 'Books',           description: 'Physical and digital books',            color: '#EC4899', icon: 'book-open' },
                { name: 'Health & Beauty', description: 'Personal care products',               color: '#06B6D4', icon: 'heart' },
            ];

            for (const cat of categorySeed) {
                const { data: existing } = await supabase
                    .from('categories').select('id').eq('name', cat.name).maybeSingle();
                if (!existing) {
                    await supabase.from('categories').insert([cat]);
                }
            }

            // ── 2. Seed suppliers (idempotent) ───────────────────────────
            const supplierSeed = [
                { name: 'TechCorp India',      email: 'orders@techcorp.in',         phone: '+91-9876543210', city: 'New Delhi',  state: 'Delhi',         contact_person: 'Rajesh Kumar',  status: 'active' },
                { name: 'Fashion Hub Ltd',     email: 'contact@fashionhub.com',     phone: '+91-9876543211', city: 'Mumbai',     state: 'Maharashtra',   contact_person: 'Priya Sharma',  status: 'active' },
                { name: 'Fresh Foods Pvt Ltd', email: 'orders@freshfoods.in',       phone: '+91-9876543212', city: 'Bangalore',  state: 'Karnataka',     contact_person: 'Amit Patel',    status: 'active' },
                { name: 'Office Mart',         email: 'support@officemart.in',      phone: '+91-9876543213', city: 'Chennai',    state: 'Tamil Nadu',    contact_person: 'Sneha Reddy',   status: 'active' },
                { name: 'Comfort Furniture',   email: 'sales@comfortfurniture.in',  phone: '+91-9876543214', city: 'Hyderabad',  state: 'Telangana',     contact_person: 'Vikram Singh',  status: 'active' },
            ];

            for (const sup of supplierSeed) {
                const { data: existing } = await supabase
                    .from('suppliers').select('id').eq('name', sup.name).maybeSingle();
                if (!existing) {
                    await supabase.from('suppliers').insert([sup]);
                }
            }

            // ── 3. Reload categories & suppliers ─────────────────────────
            const [{ data: cats }, { data: sups }] = await Promise.all([
                supabase.from('categories').select('id, name'),
                supabase.from('suppliers').select('id, name'),
            ]);

            if (!cats?.length || !sups?.length) {
                throw new Error('Could not create categories or suppliers. Check Supabase RLS policies.');
            }

            const getCatId = (name) => cats.find(c => c.name.toLowerCase().includes(name.toLowerCase()))?.id || cats[0].id;
            const getSupId = (name) => sups.find(s => s.name.toLowerCase().includes(name.toLowerCase()))?.id || sups[0].id;

            // ── 4. Seed products (idempotent by SKU) ─────────────────────
            const demoProducts = [
                {
                    name: 'MacBook Pro 16"',
                    sku: 'LAP-MBP16',
                    description: 'Apple M3 Pro chip, 18GB Unified Memory, 512GB SSD, 16.2-inch Liquid Retina XDR display.',
                    category_id: getCatId('Electronics'),
                    supplier_id: getSupId('TechCorp'),
                    quantity: 12, min_stock_level: 5, unit_price: 199999.00, cost_price: 175000.00, status: 'active',
                    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'
                },
                {
                    name: 'iPhone 15 Pro Max',
                    sku: 'PHN-IP15PM',
                    description: 'Titanium design, A17 Pro chip, 48MP Main camera, 256GB storage.',
                    category_id: getCatId('Electronics'),
                    supplier_id: getSupId('TechCorp'),
                    quantity: 4, min_stock_level: 8, unit_price: 159900.00, cost_price: 140000.00, status: 'active',
                    image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'
                },
                {
                    name: 'Ergonomic Mesh Chair',
                    sku: 'FUR-ERGOCH',
                    description: 'High-back mesh chair with adjustable armrests, lumbar support, and synchro-tilt mechanism.',
                    category_id: getCatId('Furniture'),
                    supplier_id: getSupId('Comfort'),
                    quantity: 25, min_stock_level: 10, unit_price: 18500.00, cost_price: 14000.00, status: 'active',
                    image_url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80'
                },
                {
                    name: 'Classic Leather Jacket',
                    sku: 'CLO-LTHRJKT',
                    description: '100% genuine black lambskin leather jacket with premium metal zippers.',
                    category_id: getCatId('Clothing'),
                    supplier_id: getSupId('Fashion'),
                    quantity: 15, min_stock_level: 5, unit_price: 8999.00, cost_price: 5500.00, status: 'active',
                    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80'
                },
                {
                    name: 'Organic Dark Roast Coffee',
                    sku: 'FDB-DRKCF',
                    description: 'Single-origin Arabica coffee beans, whole bean, 1kg bag.',
                    category_id: getCatId('Food'),
                    supplier_id: getSupId('Fresh'),
                    quantity: 50, min_stock_level: 15, unit_price: 950.00, cost_price: 600.00, status: 'active',
                    image_url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=80'
                },
                {
                    name: 'Handcrafted Leather Journal',
                    sku: 'OFF-LTHRJRNL',
                    description: 'A5 leather-bound notebook with 200 pages of unlined cream paper.',
                    category_id: getCatId('Office'),
                    supplier_id: getSupId('Office'),
                    quantity: 3, min_stock_level: 8, unit_price: 1250.00, cost_price: 800.00, status: 'active',
                    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'
                },
                {
                    name: 'Sony WH-1000XM5 Headphones',
                    sku: 'ELC-SNYWH5',
                    description: 'Industry-leading noise cancelling headphones with 30-hour battery life.',
                    category_id: getCatId('Electronics'),
                    supplier_id: getSupId('TechCorp'),
                    quantity: 8, min_stock_level: 5, unit_price: 29990.00, cost_price: 22000.00, status: 'active',
                    image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80'
                },
                {
                    name: 'Adjustable Standing Desk',
                    sku: 'FUR-STNDSK',
                    description: 'Electric height-adjustable desk, 140x70cm top, memory presets.',
                    category_id: getCatId('Furniture'),
                    supplier_id: getSupId('Comfort'),
                    quantity: 0, min_stock_level: 3, unit_price: 32000.00, cost_price: 24000.00, status: 'active',
                    image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=600&q=80'
                },
            ];

            let seededCount = 0;
            let skippedCount = 0;

            for (const prod of demoProducts) {
                const { data: existing } = await supabase.from('products').select('id').eq('sku', prod.sku).maybeSingle();
                if (existing) { skippedCount++; continue; }

                const { data: insertedList, error: prodErr } = await supabase.from('products').insert([prod]).select('id, quantity');
                if (prodErr) throw prodErr;
                const inserted = insertedList?.[0];

                if (inserted && prod.quantity > 0) {
                    await supabase.from('inventory_transactions').insert([{
                        product_id: inserted.id,
                        type: 'stock_in',
                        quantity: prod.quantity,
                        previous_stock: 0,
                        new_stock: prod.quantity,
                        reference: 'INITIAL',
                        notes: 'Seeded via Settings panel demo utility.'
                    }]);
                }
                seededCount++;
            }

            if (seededCount === 0 && skippedCount > 0) {
                showToast(`All ${skippedCount} demo products already exist — nothing to seed.`, 'info');
            } else {
                showToast(`Seeded ${seededCount} products (${skippedCount} already existed). Categories & suppliers ready!`, 'success');
            }
        } catch (err) {
            console.error('Seed error:', err);
            showToast(err.message || 'Seeding failed', 'error');
        } finally {
            setSeeding(false);
        }
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
                            color: 'white', fontWeight: 700, fontSize: '1.25rem',
                            overflow: 'hidden'
                        }}>
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()
                            )}
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
                            <label className="form-label">Profile Photo</label>
                            {/* Avatar preview */}
                            {avatarUrl && (
                                <div style={{ marginBottom: '0.75rem', position: 'relative', display: 'inline-block' }}>
                                    <img src={avatarUrl} alt="Avatar preview"
                                        style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--border-light)' }}
                                        onError={() => setAvatarUrl('')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setAvatarUrl(''); showToast('Click Save Profile to apply deletion.', 'info'); }}
                                        style={{
                                            position: 'absolute', top: -6, right: -6,
                                            background: 'var(--color-danger, #ef4444)', color: 'white',
                                            border: 'none', borderRadius: '50%', width: 20, height: 20,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                                        }}
                                        title="Remove photo"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            {/* Upload row */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => avatarFileRef.current?.click()}
                                    disabled={avatarUploading}
                                    style={{ flexShrink: 0 }}
                                >
                                    {avatarUploading ? 'Uploading…' : '📷 Upload Photo'}
                                </button>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={avatarUrl}
                                    onChange={e => setAvatarUrl(e.target.value)}
                                    placeholder="or paste an image URL…"
                                    style={{ fontSize: '0.8125rem' }}
                                />
                            </div>
                            <input
                                ref={avatarFileRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => uploadAvatar(e.target.files?.[0])}
                            />
                            <p className="form-hint">Upload a photo or paste a direct image URL</p>
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

                {/* Demo Data Seeding */}
                <div className="app-card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Demo Data Utilities</h2>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Populate your inventory with sample products, categories, suppliers, and transaction history to preview the app features.
                        </p>
                        <button 
                            onClick={handleSeedDemoData} 
                            disabled={seeding}
                            className="btn btn-secondary btn-sm w-full"
                        >
                            {seeding ? 'Seeding Database...' : '⚡ Seed Sample Products with Images'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
