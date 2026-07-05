import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';
import { formatDate, debounce } from '../utils/helpers';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', contact_person: '', notes: '' };

const Suppliers = () => {
    const { showToast } = useToast();
    const { showModal, showConfirm } = useModal();

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('suppliers').select('*').order('name');
        if (!error) setSuppliers(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

    const debouncedSearch = useCallback(debounce(setSearch, 300), []);

    const filtered = search
        ? suppliers.filter(s =>
            s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase()) ||
            s.contact_person?.toLowerCase().includes(search.toLowerCase()))
        : suppliers;

    const openForm = (supplier = null) => {
        const isEdit = Boolean(supplier);
        let formData = supplier ? { ...supplier } : { ...EMPTY_FORM };

        showModal({
            title: isEdit ? 'Edit Supplier' : 'Add Supplier',
            size: 'md',
            content: (
                <form id="supplier-form" className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        const payload = Object.fromEntries(fd.entries());
                        const { error } = isEdit
                            ? await supabase.from('suppliers').update(payload).eq('id', supplier.id)
                            : await supabase.from('suppliers').insert([payload]);
                        if (error) { showToast(error.message, 'error'); return; }
                        showToast(isEdit ? 'Supplier updated' : 'Supplier added', 'success');
                        fetchSuppliers();
                    }}>
                    {[
                        { name: 'name', label: 'Company Name', required: true, defaultValue: formData.name },
                        { name: 'contact_person', label: 'Contact Person', defaultValue: formData.contact_person },
                        { name: 'email', label: 'Email', type: 'email', defaultValue: formData.email },
                        { name: 'phone', label: 'Phone', type: 'tel', defaultValue: formData.phone },
                        { name: 'address', label: 'Address', defaultValue: formData.address },
                    ].map(f => (
                        <div key={f.name} className="form-group">
                            <label className="form-label">{f.label}{f.required && ' *'}</label>
                            <input name={f.name} type={f.type || 'text'} className="form-input"
                                defaultValue={f.defaultValue || ''} required={f.required} />
                        </div>
                    ))}
                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea name="notes" className="form-input" rows={2} defaultValue={formData.notes || ''} />
                    </div>
                </form>
            ),
            confirmText: isEdit ? 'Save Changes' : 'Add Supplier',
            onConfirm: () => {
                document.getElementById('supplier-form').requestSubmit();
            },
        });
    };

    const handleDelete = (id, name) => {
        showConfirm(`Delete "${name}"? This cannot be undone.`, 'Delete Supplier', async () => {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) { showToast('Error deleting supplier', 'error'); return; }
            showToast('Supplier deleted', 'success');
            fetchSuppliers();
        });
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Suppliers</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Manage your supplier contacts</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openForm()}>+ Add Supplier</button>
            </div>

            {/* Search */}
            <div className="app-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', maxWidth: 360 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input type="text" className="form-input" placeholder="Search suppliers..."
                        style={{ paddingLeft: '2.25rem' }} onChange={e => debouncedSearch(e.target.value)} />
                </div>
            </div>

            {/* Table */}
            <div className="app-card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                            style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem' }}>
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>No suppliers found</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => openForm()}>Add Supplier</button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Contact Person</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Added</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id} className="table-row-hover">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                                    background: 'linear-gradient(135deg,var(--color-primary-100),var(--color-primary-200))',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary-600)'
                                                }}>
                                                    {s.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{s.name}</p>
                                                    {s.address && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{s.address}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.contact_person || '—'}</td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {s.email ? <a href={`mailto:${s.email}`} style={{ color: 'var(--color-primary-500)' }}>{s.email}</a> : '—'}
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.phone || '—'}</td>
                                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{formatDate(s.created_at)}</td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openForm(s)} title="Edit">
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(s.id, s.name)} title="Delete">
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Suppliers;
