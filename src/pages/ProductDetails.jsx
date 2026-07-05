import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';
import { formatCurrency, formatDate } from '../utils/helpers';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { showConfirm } = useModal();

    const [product, setProduct] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [{ data: prod, error }, { data: txns }] = await Promise.all([
                supabase.from('products').select('*, categories(name, color), suppliers(name)').eq('id', id).single(),
                supabase.from('inventory_transactions').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(10),
            ]);
            if (error || !prod) { showToast('Product not found', 'error'); navigate('/products'); return; }
            setProduct(prod);
            setTransactions(txns || []);
            setLoading(false);
        };
        load();
    }, [id, navigate, showToast]);

    const handleDelete = () => {
        showConfirm(`Delete "${product.name}"? This cannot be undone.`, 'Delete Product', async () => {
            await supabase.from('products').delete().eq('id', id);
            showToast('Product deleted', 'success');
            navigate('/products');
        });
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-tertiary)' }}>Loading...</div>;
    if (!product) return null;

    const stockStatus = product.quantity === 0 ? 'Out of Stock'
        : product.quantity <= product.min_stock_level ? 'Low Stock' : 'In Stock';
    const statusColor = product.quantity === 0 ? '#991b1b'
        : product.quantity <= product.min_stock_level ? '#854d0e' : '#166534';
    const statusBg = product.quantity === 0 ? '#fee2e2'
        : product.quantity <= product.min_stock_level ? '#fef9c3' : '#dcfce7';

    const TYPE_LABEL = { stock_in: 'Stock In', stock_out: 'Stock Out', adjustment: 'Adjustment' };

    return (
        <div>
            {/* Breadcrumb + actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <Link to="/products" style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>← Products</Link>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0 0' }}>{product.name}</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/products/edit/${id}`} className="btn btn-secondary btn-sm">Edit</Link>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', border: 'none' }} onClick={handleDelete}>Delete</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
                {/* Product info */}
                <div className="app-card" style={{ padding: '1.5rem' }}>
                    {/* Image */}
                    <div style={{
                        width: '100%', height: 180, borderRadius: 8, marginBottom: '1.25rem',
                        background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                        {product.image_url
                            ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-tertiary)' }}><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                        }
                    </div>

                    {/* Info rows */}
                    {[
                        ['SKU', <code style={{ fontSize: '0.8125rem', background: 'var(--bg-hover)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{product.sku}</code>],
                        ['Category', product.categories?.name || '—'],
                        ['Supplier', product.suppliers?.name || '—'],
                        ['Location', product.location || '—'],
                        ['Status', <span style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 99, background: product.status === 'active' ? '#dcfce7' : '#f1f5f9', color: product.status === 'active' ? '#166534' : '#475569' }}>{product.status}</span>],
                        ['Added', formatDate(product.created_at)],
                    ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{label}</span>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                        </div>
                    ))}

                    {product.description && (
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Description</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{product.description}</p>
                        </div>
                    )}
                </div>

                {/* Inventory stats */}
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        {[
                            { label: 'Current Qty', value: product.quantity, color: statusColor },
                            { label: 'Min Stock Level', value: product.min_stock_level },
                            { label: 'Unit Price', value: formatCurrency(product.unit_price) },
                            { label: 'Cost Price', value: product.cost_price ? formatCurrency(product.cost_price) : '—' },
                            { label: 'Stock Status', value: stockStatus, color: statusColor, bg: statusBg, isBadge: true },
                            { label: 'Total Value', value: formatCurrency(product.quantity * (product.unit_price || 0)) },
                        ].map(item => (
                            <div key={item.label} className="app-card" style={{ padding: '1rem' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 0.25rem' }}>{item.label}</p>
                                {item.isBadge
                                    ? <span style={{ fontSize: '0.875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 99, background: item.bg, color: item.color }}>{item.value}</span>
                                    : <p style={{ fontSize: '1.125rem', fontWeight: 700, color: item.color || 'var(--text-primary)', margin: 0 }}>{item.value}</p>
                                }
                            </div>
                        ))}
                    </div>

                    {/* Recent transactions */}
                    <div className="app-card" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1rem 0' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.875rem' }}>
                                Recent Movements
                            </h3>
                        </div>
                        {transactions.length === 0 ? (
                            <p style={{ padding: '1rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No transactions yet.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr><th>Type</th><th>Qty</th><th>Reference</th><th>Date</th></tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(t => (
                                            <tr key={t.id}>
                                                <td><span style={{ fontSize: '0.75rem', fontWeight: 600, color: t.type === 'stock_in' ? '#166534' : t.type === 'stock_out' ? '#1e40af' : '#854d0e' }}>{TYPE_LABEL[t.type]}</span></td>
                                                <td style={{ fontWeight: 700, color: t.type === 'stock_out' ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                                                    {t.type === 'stock_out' ? '-' : '+'}{t.quantity}
                                                </td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{t.reference || '—'}</td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{formatDate(t.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
