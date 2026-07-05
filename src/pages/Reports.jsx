import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, convertToCSV, downloadFile } from '../utils/helpers';

const Reports = () => {
    const { showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [{ data: prods }, { data: txns }] = await Promise.all([
            supabase.from('products').select('*, categories(name), suppliers(name)').order('name'),
            supabase.from('inventory_transactions').select('*, product:products(name,sku)').order('created_at', { ascending: false }),
        ]);
        setProducts(prods || []);
        setTransactions(txns || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Summary stats
    const totalValue = products.reduce((s, p) => s + p.quantity * (p.unit_price || 0), 0);
    const lowStock = products.filter(p => p.quantity <= p.min_stock_level);
    const outOfStock = products.filter(p => p.quantity === 0);
    const stockIn = transactions.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0);
    const stockOut = transactions.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0);

    const exportProducts = () => {
        const csv = convertToCSV(products, [
            { key: 'name', label: 'Product Name' },
            { key: 'sku', label: 'SKU' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'unit_price', label: 'Unit Price' },
            { key: 'min_stock_level', label: 'Min Stock' },
            { key: 'status', label: 'Status' },
        ]);
        downloadFile(csv, `products-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
        showToast('Products exported!', 'success');
    };

    const exportTransactions = () => {
        const csv = convertToCSV(transactions.map(t => ({
            ...t,
            product_name: t.product?.name || '',
            product_sku: t.product?.sku || '',
        })), [
            { key: 'product_name', label: 'Product' },
            { key: 'product_sku', label: 'SKU' },
            { key: 'type', label: 'Type' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'reference', label: 'Reference' },
            { key: 'notes', label: 'Notes' },
            { key: 'created_at', label: 'Date' },
        ]);
        downloadFile(csv, `transactions-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
        showToast('Transactions exported!', 'success');
    };

    const StatBox = ({ label, value, sub, color }) => (
        <div className="app-card" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: '0 0 0.5rem' }}>{label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: color || 'var(--text-primary)', margin: 0 }}>{value}</p>
            {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0' }}>{sub}</p>}
        </div>
    );

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-tertiary)' }}>Loading reports...</div>;

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Reports</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Summary and exports of your inventory data</p>
            </div>

            {/* Summary grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatBox label="Total Products" value={products.length} />
                <StatBox label="Inventory Value" value={formatCurrency(totalValue)} />
                <StatBox label="Low Stock Items" value={lowStock.length} color={lowStock.length > 0 ? 'var(--color-danger)' : undefined} />
                <StatBox label="Out of Stock" value={outOfStock.length} color={outOfStock.length > 0 ? 'var(--color-danger)' : undefined} />
                <StatBox label="Total Stock In" value={stockIn} color="#166534" />
                <StatBox label="Total Stock Out" value={stockOut} color="var(--color-primary-600)" />
            </div>

            {/* Export actions */}
            <div className="app-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Export Data</h2>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={exportProducts}>
                        ↓ Export Products CSV
                    </button>
                    <button className="btn btn-secondary" onClick={exportTransactions}>
                        ↓ Export Transactions CSV
                    </button>
                </div>
            </div>

            {/* Low stock table */}
            {lowStock.length > 0 && (
                <div className="app-card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1rem 0' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
                            Low Stock Products ({lowStock.length})
                        </h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Current Qty</th>
                                    <th>Min Level</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStock.map(p => (
                                    <tr key={p.id} className="table-row-hover">
                                        <td style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.name}</td>
                                        <td><code style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{p.sku}</code></td>
                                        <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{p.quantity}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{p.min_stock_level}</td>
                                        <td>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 99,
                                                background: p.quantity === 0 ? '#fee2e2' : '#fef9c3',
                                                color: p.quantity === 0 ? '#991b1b' : '#854d0e' }}>
                                                {p.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Top products by value */}
            <div className="app-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1rem 0' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
                        Top Products by Value
                    </h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...products]
                                .sort((a, b) => (b.quantity * b.unit_price) - (a.quantity * a.unit_price))
                                .slice(0, 10)
                                .map((p, i) => (
                                    <tr key={p.id} className="table-row-hover">
                                        <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{p.quantity}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.unit_price)}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(p.quantity * p.unit_price)}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
