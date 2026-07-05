import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';
import { formatCurrency, formatNumber, debounce } from '../utils/helpers';

const PER_PAGE = 10;

const STATUS_BADGE = {
    active:       { label: 'Active',       bg: '#dcfce7', color: '#166534' },
    inactive:     { label: 'Inactive',     bg: '#f1f5f9', color: '#475569' },
    discontinued: { label: 'Discontinued', bg: '#fee2e2', color: '#991b1b' },
};

const STOCK_BADGE = {
    in_stock:     { label: 'In Stock',     bg: '#dcfce7', color: '#166534' },
    low_stock:    { label: 'Low Stock',    bg: '#fef9c3', color: '#854d0e' },
    out_of_stock: { label: 'Out of Stock', bg: '#fee2e2', color: '#991b1b' },
};

function getStockStatus(product) {
    if (product.quantity === 0) return 'out_of_stock';
    if (product.quantity <= product.min_stock_level) return 'low_stock';
    return 'in_stock';
}

const Products = () => {
    const { showToast } = useToast();
    const { showConfirm } = useModal();
    const navigate = useNavigate();

    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter state
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('created_at:desc');

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        const { data } = await supabase.from('categories').select('id, name').order('name');
        setCategories(data || []);
    }, []);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(name, color), suppliers(name)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setAllProducts(data || []);
        } catch (err) {
            showToast('Error loading products', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, [fetchCategories, fetchProducts]);

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((val) => { setSearch(val); setCurrentPage(1); }, 300),
        []
    );

    // Apply filters + sort client-side
    const filtered = (() => {
        let list = [...allProducts];
        if (search) {
            const term = search.toLowerCase();
            list = list.filter(p =>
                p.name?.toLowerCase().includes(term) ||
                p.sku?.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
        }
        if (categoryFilter) list = list.filter(p => p.category_id === categoryFilter);
        if (statusFilter)   list = list.filter(p => p.status === statusFilter);

        const [col, dir] = sortBy.split(':');
        list.sort((a, b) => {
            let va = a[col] ?? ''; let vb = b[col] ?? '';
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return dir === 'asc' ? -1 : 1;
            if (va > vb) return dir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    })();

    // Pagination
    const totalPages  = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const page        = Math.min(currentPage, totalPages);
    const pageStart   = (page - 1) * PER_PAGE;
    const pageItems   = filtered.slice(pageStart, pageStart + PER_PAGE);

    const handleDelete = (id, name) => {
        showConfirm(
            `Delete "${name}"? This cannot be undone.`,
            'Delete Product',
            async () => {
                const { error } = await supabase.from('products').delete().eq('id', id);
                if (error) { showToast('Error deleting product', 'error'); return; }
                showToast('Product deleted', 'success');
                fetchProducts();
            },
            null,
            'Delete',
            'btn-danger'
        );
    };

    return (
        <div>
            {/* Page header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Products</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                        Manage and track your inventory products
                        {!loading && <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}> &mdash; {allProducts.length} total</span>}
                    </p>
                </div>
                <Link to="/products/add" className="btn btn-primary btn-sm">
                    + Add Product
                </Link>
            </div>

            {/* Filter bar */}
            <div className="app-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {/* Search */}
                    <div style={{ flex: '1 1 220px', position: 'relative' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search name, SKU..."
                            style={{ paddingLeft: '2.25rem', width: '100%' }}
                            onChange={e => debouncedSearch(e.target.value)}
                        />
                    </div>

                    {/* Category */}
                    <select className="form-select" style={{ minWidth: 150 }}
                        value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    {/* Status */}
                    <select className="form-select" style={{ minWidth: 130 }}
                        value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="discontinued">Discontinued</option>
                    </select>

                    {/* Sort */}
                    <select className="form-select" style={{ minWidth: 155 }}
                        value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="created_at:desc">Newest First</option>
                        <option value="created_at:asc">Oldest First</option>
                        <option value="name:asc">Name A–Z</option>
                        <option value="name:desc">Name Z–A</option>
                        <option value="quantity:asc">Qty Low–High</option>
                        <option value="quantity:desc">Qty High–Low</option>
                        <option value="unit_price:asc">Price Low–High</option>
                        <option value="unit_price:desc">Price High–Low</option>
                    </select>
                </div>
            </div>

            {/* Table card */}
            <div className="app-card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                            style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem' }}>
                            <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                        </svg>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No products found</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
                            {search || categoryFilter || statusFilter ? 'Try changing your filters.' : 'Add your first product to get started.'}
                        </p>
                        {!search && !categoryFilter && !statusFilter && (
                            <Link to="/products/add" className="btn btn-primary btn-sm">Add Product</Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Category</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map(product => {
                                        const stockKey = getStockStatus(product);
                                        const stock    = STOCK_BADGE[stockKey];
                                        const catColor = product.categories?.color || '#6B7280';
                                        const catName  = product.categories?.name  || 'Uncategorized';

                                        return (
                                            <tr key={product.id} className="table-row-hover">
                                                {/* Product name + image */}
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{
                                                            width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                                                            background: 'var(--bg-hover)', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                                        }}>
                                                            {product.image_url
                                                                ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-tertiary)' }}><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                                                            }
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{product.name}</p>
                                                            {product.suppliers?.name && (
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{product.suppliers.name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* SKU */}
                                                <td>
                                                    <code style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '0.2rem 0.5rem', borderRadius: 4, color: 'var(--text-secondary)' }}>
                                                        {product.sku}
                                                    </code>
                                                </td>

                                                {/* Category */}
                                                <td>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                        fontSize: '0.75rem', fontWeight: 500, padding: '0.2rem 0.6rem',
                                                        borderRadius: 99, background: `${catColor}22`, color: catColor
                                                    }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                                                        {catName}
                                                    </span>
                                                </td>

                                                {/* Quantity */}
                                                <td>
                                                    <span style={{
                                                        fontWeight: 700, fontSize: '0.875rem',
                                                        color: stockKey === 'in_stock' ? 'var(--text-primary)' : 'var(--color-danger)'
                                                    }}>
                                                        {formatNumber(product.quantity)}
                                                    </span>
                                                </td>

                                                {/* Price */}
                                                <td style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {formatCurrency(product.unit_price)}
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    <span style={{
                                                        fontSize: '0.75rem', fontWeight: 600,
                                                        padding: '0.2rem 0.6rem', borderRadius: 99,
                                                        background: stock.bg, color: stock.color
                                                    }}>
                                                        {stock.label}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                        <Link to={`/products/${product.id}`} className="btn btn-ghost btn-sm" title="View">
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                                        </Link>
                                                        <Link to={`/products/edit/${product.id}`} className="btn btn-ghost btn-sm" title="Edit">
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </Link>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            title="Delete"
                                                            style={{ color: 'var(--color-danger)' }}
                                                            onClick={() => handleDelete(product.id, product.name)}
                                                        >
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.875rem 1rem', borderTop: '1px solid var(--border-light)',
                            flexWrap: 'wrap', gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                Showing {pageStart + 1}–{Math.min(pageStart + PER_PAGE, filtered.length)} of {filtered.length}
                            </span>
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button className="pagination-btn" disabled={page === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n =>
                                        n === 1 || n === totalPages || Math.abs(n - page) <= 1
                                    ).reduce((acc, n, idx, arr) => {
                                        if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                                        acc.push(n);
                                        return acc;
                                    }, []).map((n, i) =>
                                        n === '...'
                                            ? <span key={`dots-${i}`} className="pagination-btn" style={{ cursor: 'default' }}>…</span>
                                            : <button key={n} className={`pagination-btn ${n === page ? 'active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
                                    )}
                                    <button className="pagination-btn" disabled={page === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Products;
