import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { supabase } from '../supabaseClient';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ─── Animated Counter Hook ────────────────────────────────────
function useAnimatedCounter(target, duration = 900) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                setDisplay(target);
                clearInterval(timer);
            } else {
                setDisplay(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return display;
}

// ─── Skeleton Loader ──────────────────────────────────────────
const SkeletonBlock = ({ height = 60, radius = 12 }) => (
    <div className="skeleton" style={{ height, borderRadius: radius }} />
);

// ─── Stat Card ────────────────────────────────────────────────
const StatCard = ({ title, value, badge, badgeStyle, iconBg, iconColor, icon, delay = 0, isValue = false }) => {
    const animated = useAnimatedCounter(isValue ? 0 : (typeof value === 'number' ? value : 0));
    return (
        <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-center justify-between mb-4">
                <div className="icon-box icon-box-lg" style={{ background: iconBg, color: iconColor }}>
                    {icon}
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={badgeStyle}>{badge}</span>
            </div>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {isValue ? formatCurrency(typeof value === 'number' ? value : 0) : animated}
            </p>
        </div>
    );
};

// ─── Transaction Type Config ──────────────────────────────────
const TX_TYPE = {
    stock_in:   { bg: 'var(--color-success-light)', text: '#065F46', symbol: '↑', label: 'Stock In' },
    stock_out:  { bg: 'var(--color-info-light)',    text: '#1E40AF', symbol: '↓', label: 'Stock Out' },
    adjustment: { bg: 'var(--color-warning-light)', text: '#92400E', symbol: '↔', label: 'Adjust' },
};

// ─── Dashboard Component ──────────────────────────────────────
const Dashboard = () => {
    const { isDarkMode } = useTheme();
    const { showToast } = useToast();

    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        totalSuppliers: 0,
        lowStockCount: 0,
        inventoryValue: 0,
        monthlyTransactions: 0,
    });
    const [lowStockItems, setLowStockItems]       = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [chartLoading, setChartLoading]         = useState(true);
    const [loading, setLoading]                   = useState(true);

    const [barData, setBarData]   = useState(null);
    const [donutData, setDonutData] = useState(null);

    // Chart colors that respond to dark mode
    const chartColors = useCallback(() => {
        return {
            gridColor:  isDarkMode ? '#334155' : '#E2E8F0',
            tickColor:  isDarkMode ? '#94A3B8' : '#475569',
            stockIn:    isDarkMode ? 'rgba(52,211,153,0.75)'  : 'rgba(16,185,129,0.75)',
            stockOut:   isDarkMode ? 'rgba(96,165,250,0.75)'  : 'rgba(59,130,246,0.75)',
        };
    }, [isDarkMode]);

    // ─── Fetch All Dashboard Data ─────────────────────────────
    const fetchAll = useCallback(async () => {
        try {
            // Parallel fetches for counts
            const [
                { count: productsCount },
                { count: catCount },
                { count: supCount },
                { data: allProducts },
                { data: invValue },
                { count: txnCount },
            ] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('categories').select('*', { count: 'exact', head: true }),
                supabase.from('suppliers').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('quantity, min_stock_level, name, sku').order('quantity', { ascending: true }),
                supabase.from('products').select('quantity, unit_price'),
                supabase.from('inventory_transactions').select('*', { count: 'exact', head: true })
                    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
            ]);

            const low = (allProducts || []).filter(p => p.quantity <= p.min_stock_level);
            const totalValue = (invValue || []).reduce((s, p) => s + (p.quantity * (p.unit_price || 0)), 0);

            setStats({
                totalProducts:       productsCount || 0,
                totalCategories:     catCount || 0,
                totalSuppliers:      supCount || 0,
                lowStockCount:       low.length,
                inventoryValue:      totalValue,
                monthlyTransactions: txnCount || 0,
            });
            setLowStockItems(low.slice(0, 5));

            // Recent transactions
            const { data: txns } = await supabase
                .from('inventory_transactions')
                .select('*, product:products(name, sku)')
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentTransactions(txns || []);

        } catch (err) {
            console.error('Dashboard fetch error:', err);
            showToast('Error loading dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // ─── Fetch Chart Data ─────────────────────────────────────
    const fetchCharts = useCallback(async () => {
        setChartLoading(true);
        try {
            const c = chartColors();
            const months = [];
            const stockIn  = [];
            const stockOut = [];

            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                months.push(start.toLocaleString('en', { month: 'short' }));

                const [{ count: inC }, { count: outC }] = await Promise.all([
                    supabase.from('inventory_transactions').select('*', { count: 'exact', head: true })
                        .eq('type', 'stock_in').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
                    supabase.from('inventory_transactions').select('*', { count: 'exact', head: true })
                        .eq('type', 'stock_out').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
                ]);
                stockIn.push(inC || 0);
                stockOut.push(outC || 0);
            }

            setBarData({
                labels: months,
                datasets: [
                    { label: 'Stock In',  data: stockIn,  backgroundColor: c.stockIn,  borderRadius: 6, borderSkipped: false },
                    { label: 'Stock Out', data: stockOut, backgroundColor: c.stockOut, borderRadius: 6, borderSkipped: false },
                ],
            });

            // Category distribution
            const { data: catData } = await supabase
                .from('products')
                .select('category_id, categories(name, color)');

            if (catData) {
                const map = {};
                catData.forEach(p => {
                    const name  = p.categories?.name  || 'Uncategorized';
                    const color = p.categories?.color || '#6B7280';
                    if (!map[name]) map[name] = { count: 0, color };
                    map[name].count++;
                });
                const labels = Object.keys(map);
                const values = labels.map(l => map[l].count);
                const colors = labels.map(l => map[l].color);

                setDonutData({ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] });
            }
        } catch (err) {
            console.error('Chart fetch error:', err);
        } finally {
            setChartLoading(false);
        }
    }, [chartColors]);

    // ─── Initial Load + Realtime Subscriptions ────────────────
    useEffect(() => {
        fetchAll();
        fetchCharts();

        const channel = supabase.channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, fetchAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchAll)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [fetchAll]);

    // Re-build charts when dark mode changes
    useEffect(() => {
        if (!loading) fetchCharts();
    }, [isDarkMode]);

    // ─── Chart Options ────────────────────────────────────────
    const c = chartColors();
    const barOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: c.tickColor, font: { family: 'Inter', size: 11 } } },
            y: { grid: { color: c.gridColor }, ticks: { color: c.tickColor, font: { family: 'Inter', size: 11 }, stepSize: 1 } },
        },
    };
    const donutOptions = {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { display: false } },
    };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1>Dashboard Overview</h1>
                <p>Monitor your inventory performance and key metrics</p>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                <StatCard
                    title="Total Products" value={stats.totalProducts} badge="+12%" delay={0}
                    badgeStyle={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
                    iconBg="linear-gradient(135deg,var(--color-primary-100),var(--color-primary-200))"
                    iconColor="var(--color-primary-600)"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>}
                />
                <StatCard
                    title="Categories" value={stats.totalCategories} badge="+5%" delay={80}
                    badgeStyle={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
                    iconBg="linear-gradient(135deg,#E0E7FF,#C7D2FE)" iconColor="#4F46E5"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>}
                />
                <Link to="/inventory" className="stat-card block cursor-pointer" style={{ animationDelay: '160ms', textDecoration: 'none' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="icon-box icon-box-lg" style={{ background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', color: '#D97706' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>Action</span>
                    </div>
                    <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Low Stock Items</h3>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>{stats.lowStockCount}</p>
                </Link>
                <StatCard
                    title="Suppliers" value={stats.totalSuppliers} badge="Active" delay={240}
                    badgeStyle={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
                    iconBg="linear-gradient(135deg,#D1FAE5,#A7F3D0)" iconColor="#059669"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                />
                <StatCard
                    title="Inventory Value" value={stats.inventoryValue} badge="Value" delay={320} isValue
                    badgeStyle={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}
                    iconBg="linear-gradient(135deg,#DBEAFE,#BFDBFE)" iconColor="var(--color-primary-600)"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                />
                <StatCard
                    title="Transactions" value={stats.monthlyTransactions} badge="This Month" delay={400}
                    badgeStyle={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
                    iconBg="linear-gradient(135deg,#F3E8FF,#E9D5FF)" iconColor="#7C3AED"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>}
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Bar Chart */}
                <div className="app-card p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Stock Movement Overview</h3>
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Monthly stock in vs stock out</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-success)' }}></span>
                                Stock In
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-primary-500)' }}></span>
                                Stock Out
                            </span>
                        </div>
                    </div>
                    <div style={{ height: 300 }}>
                        {chartLoading || !barData
                            ? <SkeletonBlock height={280} />
                            : <Bar data={barData} options={barOptions} />
                        }
                    </div>
                </div>

                {/* Doughnut Chart */}
                <div className="app-card p-6">
                    <div className="mb-6">
                        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Category Distribution</h3>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Products by category</p>
                    </div>
                    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {chartLoading || !donutData
                            ? <SkeletonBlock height={200} radius={9999} />
                            : donutData.labels.length === 0
                                ? <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No category data</p>
                                : <Doughnut data={donutData} options={donutOptions} />
                        }
                    </div>
                    {/* Legend */}
                    {donutData && !chartLoading && (
                        <div className="mt-4 space-y-2">
                            {donutData.labels.map((label, i) => (
                                <div key={label} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: donutData.datasets[0].backgroundColor[i] }}></span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                    </span>
                                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {donutData.datasets[0].data[i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom Widgets ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <div className="app-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h3>
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Latest stock movements</p>
                        </div>
                        <Link to="/transactions" className="text-sm font-medium link-underline" style={{ color: 'var(--color-primary-500)' }}>
                            View All
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {loading
                            ? Array(4).fill(0).map((_, i) => <SkeletonBlock key={i} />)
                            : recentTransactions.length === 0
                                ? (
                                    <div className="empty-state" style={{ padding: '2rem' }}>
                                        <div className="empty-state-icon" style={{ width: 60, height: 60 }}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                                        </div>
                                        <p className="text-sm">No transactions yet</p>
                                    </div>
                                )
                                : recentTransactions.map(txn => {
                                    const tc = TX_TYPE[txn.type] || TX_TYPE.adjustment;
                                    return (
                                        <div key={txn.id} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: 'var(--bg-hover)' }}>
                                            <div className="icon-box icon-box-sm" style={{ background: tc.bg, color: tc.text, flexShrink: 0 }}>
                                                <span style={{ fontSize: 14, fontWeight: 700 }}>{tc.symbol}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                                    {txn.product?.name || 'Unknown Product'}
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                    {tc.label} {txn.quantity} units{txn.reference ? ` · ${txn.reference}` : ''}
                                                </p>
                                            </div>
                                            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                                                {formatDate(txn.created_at)}
                                            </span>
                                        </div>
                                    );
                                })
                        }
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="app-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Low Stock Alerts</h3>
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Items needing attention</p>
                        </div>
                        <Link to="/inventory" className="text-sm font-medium link-underline" style={{ color: 'var(--color-primary-500)' }}>
                            View All
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {loading
                            ? Array(4).fill(0).map((_, i) => <SkeletonBlock key={i} />)
                            : lowStockItems.length === 0
                                ? (
                                    <div className="empty-state" style={{ padding: '2rem' }}>
                                        <div className="empty-state-icon" style={{ width: 60, height: 60 }}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                        </div>
                                        <p className="text-sm">All items are well stocked!</p>
                                    </div>
                                )
                                : lowStockItems.map(item => {
                                    const pct = Math.round((item.quantity / Math.max(item.min_stock_level, 1)) * 100);
                                    const barColor = pct <= 25 ? 'var(--color-danger)' : pct <= 50 ? 'var(--color-warning)' : 'var(--color-primary-500)';
                                    return (
                                        <div key={item.sku} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: 'var(--bg-hover)' }}>
                                            <div className="icon-box icon-box-sm" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', flexShrink: 0 }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                                    <span className="text-xs font-semibold ml-2" style={{ color: barColor }}>
                                                        {item.quantity}/{item.min_stock_level}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border-light)' }}>
                                                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
