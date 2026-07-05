import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';
import { formatCurrency, formatDate, debounce } from '../utils/helpers';

const TYPE_BADGE = {
    stock_in:   { label: 'Stock In',   bg: '#dcfce7', color: '#166534' },
    stock_out:  { label: 'Stock Out',  bg: '#dbeafe', color: '#1e40af' },
    adjustment: { label: 'Adjustment', bg: '#fef9c3', color: '#854d0e' },
};

const Inventory = () => {
    const { showToast } = useToast();
    const { showModal } = useModal();

    const [transactions, setTransactions] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const PER_PAGE = 15;

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [{ data: txns }, { data: prods }] = await Promise.all([
            supabase.from('inventory_transactions')
                .select('*, product:products(name, sku)')
                .order('created_at', { ascending: false }),
            supabase.from('products').select('id, name, sku, quantity, min_stock_level').order('name'),
        ]);
        setTransactions(txns || []);
        setProducts(prods || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const debouncedSearch = useCallback(debounce((v) => { setSearch(v); setCurrentPage(1); }, 300), []);

    const filtered = transactions.filter(t => {
        const matchType = !typeFilter || t.type === typeFilter;
        const matchSearch = !search || t.product?.name?.toLowerCase().includes(search.toLowerCase())
            || t.product?.sku?.toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // Low stock list
    const lowStock = products.filter(p => p.quantity <= p.min_stock_level);

    const openAdjustModal = () => {
        showModal({
            title: 'Record Stock Movement',
            size: 'md',
            content: (
                <form id="adj-form" className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        const productId = fd.get('product_id');
                        const type = fd.get('type');
                        const qty = parseInt(fd.get('quantity'));
                        const notes = fd.get('notes');

                        if (!productId || !qty || qty <= 0) {
                            showToast('Please fill all required fields', 'error'); return;
                        }

                        const prod = products.find(p => p.id === productId);
                        let newQty = prod.quantity;
                        if (type === 'stock_in')   newQty += qty;
                        if (type === 'stock_out')  newQty = Math.max(0, newQty - qty);
                        if (type === 'adjustment') newQty = qty;

                        const [{ error: tErr }, { error: pErr }] = await Promise.all([
                            supabase.from('inventory_transactions').insert([{
                                product_id: productId, type, quantity: qty,
                                notes: notes || null, reference: `ADJ-${Date.now()}`
                            }]),
                            supabase.from('products').update({ quantity: newQty }).eq('id', productId),
                        ]);

                        if (tErr || pErr) { showToast('Error recording movement', 'error'); return; }
                        showToast('Stock updated successfully', 'success');
                        fetchData();
                    }}>
                    <div className="form-group">
                        <label className="form-label">Product *</label>
                        <select name="product_id" className="form-select" required>
                            <option value="">-- Select Product --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type *</label>
                        <select name="type" className="form-select" required>
                            <option value="stock_in">Stock In</option>
                            <option value="stock_out">Stock Out</option>
                            <option value="adjustment">Adjustment (set absolute quantity)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Quantity *</label>
                        <input name="quantity" type="number" min="1" className="form-input" required placeholder="Enter quantity" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea name="notes" className="form-input" rows={2} placeholder="Optional notes" />
                    </div>
                </form>
            ),
            confirmText: 'Record Movement',
            onConfirm: () => document.getElementById('adj-form').requestSubmit(),
        });
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Inventory</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Stock movements and adjustments</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openAdjustModal}>+ Record Movement</button>
            </div>

            {/* Low stock banner */}
            {lowStock.length > 0 && (
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span style={{ fontSize: '0.875rem', color: '#92400e' }}>
                        <strong>{lowStock.length} item{lowStock.length > 1 ? 's' : ''}</strong> {lowStock.length > 1 ? 'are' : 'is'} low on stock: {lowStock.slice(0, 3).map(p => p.name).join(', ')}{lowStock.length > 3 ? '...' : ''}
                    </span>
                </div>
            )}

            {/* Filters */}
            <div className="app-card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', position: 'relative' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input type="text" className="form-input" placeholder="Search product..."
                        style={{ paddingLeft: '2.25rem', width: '100%' }} onChange={e => debouncedSearch(e.target.value)} />
                </div>
                <select className="form-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="">All Types</option>
                    <option value="stock_in">Stock In</option>
                    <option value="stock_out">Stock Out</option>
                    <option value="adjustment">Adjustment</option>
                </select>
            </div>

            {/* Transactions table */}
            <div className="app-card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
                ) : pageItems.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        <p>No transactions recorded yet.</p>
                        <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={openAdjustModal}>Record First Movement</button>
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Type</th>
                                        <th>Quantity</th>
                                        <th>Reference</th>
                                        <th>Notes</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map(t => {
                                        const badge = TYPE_BADGE[t.type] || TYPE_BADGE.adjustment;
                                        return (
                                            <tr key={t.id} className="table-row-hover">
                                                <td>
                                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{t.product?.name || '—'}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{t.product?.sku}</p>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 99, background: badge.bg, color: badge.color }}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 700, fontSize: '0.875rem', color: t.type === 'stock_out' ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                                                    {t.type === 'stock_out' ? '-' : '+'}{t.quantity}
                                                </td>
                                                <td>
                                                    {t.reference
                                                        ? <code style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{t.reference}</code>
                                                        : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                                                    }
                                                </td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: 200 }}>
                                                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {t.notes || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{formatDate(t.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                            </span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button className="pagination-btn" disabled={page === 1} onClick={() => setCurrentPage(p => p - 1)}>←</button>
                                <span className="pagination-btn active">{page}/{totalPages}</span>
                                <button className="pagination-btn" disabled={page === totalPages} onClick={() => setCurrentPage(p => p + 1)}>→</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Inventory;
