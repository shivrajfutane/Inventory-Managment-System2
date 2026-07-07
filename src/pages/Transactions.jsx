import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { formatDate, debounce } from '../utils/helpers';

const TYPE_BADGE = {
    stock_in:   { label: 'Stock In',   bg: '#dcfce7', color: '#166534' },
    stock_out:  { label: 'Stock Out',  bg: '#dbeafe', color: '#1e40af' },
    adjustment: { label: 'Adjustment', bg: '#fef9c3', color: '#854d0e' },
};

const Transactions = () => {
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const PER_PAGE = 20;

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inventory_transactions')
            .select('*, product:products(name, sku)')
            .order('created_at', { ascending: false });
        if (!error) setTransactions(data || []);
        else showToast('Error loading transactions', 'error');
        setLoading(false);
    }, [showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const debouncedSearch = useCallback(debounce((v) => { setSearch(v); setCurrentPage(1); }, 300), []);

    const filtered = transactions.filter(t => {
        const matchType = !typeFilter || t.type === typeFilter;
        const matchSearch = !search ||
            t.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
            t.reference?.toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Transactions</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    Full history of all stock movements
                </p>
            </div>

            {/* Filters */}
            <div className="app-card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', position: 'relative' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input type="text" className="form-input" placeholder="Search product or reference..."
                        style={{ paddingLeft: '2.25rem', width: '100%' }} onChange={e => debouncedSearch(e.target.value)} />
                </div>
                <select className="form-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="">All Types</option>
                    <option value="stock_in">Stock In</option>
                    <option value="stock_out">Stock Out</option>
                    <option value="adjustment">Adjustment</option>
                </select>
            </div>

            <div className="app-card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
                ) : pageItems.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        <p>No transactions found.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Type</th>
                                        <th>Quantity</th>
                                        <th>Stock Flow</th>
                                        <th>Reference</th>
                                        <th>Notes</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map((t, i) => {
                                        const badge = TYPE_BADGE[t.type] || TYPE_BADGE.adjustment;
                                        return (
                                            <tr key={t.id} className="table-row-hover">
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                                    {(page - 1) * PER_PAGE + i + 1}
                                                </td>
                                                <td>
                                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{t.product?.name || '—'}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{t.product?.sku}</p>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 99, background: badge.bg, color: badge.color }}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 700, color: t.type === 'stock_out' ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                                                    {t.type === 'stock_out' ? '-' : '+'}{t.quantity}
                                                </td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                    <span style={{ color: 'var(--text-tertiary)' }}>{t.previous_stock}</span>
                                                    <span style={{ margin: '0 0.25rem', color: 'var(--text-tertiary)' }}>➔</span>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.new_stock}</span>
                                                </td>
                                                <td>
                                                    {t.reference
                                                        ? <code style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{t.reference}</code>
                                                        : '—'}
                                                </td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t.notes || '—'}</td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{formatDate(t.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
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

export default Transactions;
