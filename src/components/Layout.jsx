import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';

const Layout = () => {
    const { profile, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    // Sidebar states
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    // Sync sidebar preference
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    }, [isCollapsed]);

    // Close mobile sidebar on navigation
    useEffect(() => {
        setIsMobileOpen(false);
        setUserDropdownOpen(false);
    }, [location.pathname]);

    // Fetch unread notifications count
    const fetchUnreadNotificationsCount = async () => {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('read', false);
            if (!error) {
                setLowStockCount(count || 0);
            }
        } catch (err) {
            console.error('Error fetching notifications count:', err);
        }
    };

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            if (!error && data) {
                setNotifications(data);
            }
        } catch (err) {
            console.error('Error fetching notifications list:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('read', false);
            if (!error) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setLowStockCount(0);
            }
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    };

    useEffect(() => {
        fetchUnreadNotificationsCount();

        // Subscribe to notifications changes
        const channel = supabase
            .channel('layout-notification-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                fetchUnreadNotificationsCount();
                // Refresh list if dropdown is open
                if (notificationsOpen) fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [notificationsOpen]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Helper for active navigation link
    const isLinkActive = (path) => {
        if (path === '/dashboard' && location.pathname !== '/dashboard') return false;
        return location.pathname.startsWith(path);
    };

    const navItemClass = (path) => {
        return `sidebar-link ${isLinkActive(path) ? 'active' : ''}`;
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path.startsWith('/products')) return 'Products';
        if (path.startsWith('/suppliers')) return 'Suppliers';
        if (path.startsWith('/inventory')) return 'Inventory';
        if (path.startsWith('/transactions')) return 'Transactions';
        if (path.startsWith('/reports')) return 'Reports';
        if (path.startsWith('/settings')) return 'Settings';
        if (path.startsWith('/admin')) return 'Admin Panel';
        return 'InventoryPro';
    };

    const userInitials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <div className="app-layout">
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className="mobile-overlay active" onClick={() => setIsMobileOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                    <img src="/logo.png" alt="InventoryPro Logo" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                    <span className="sidebar-logo-text font-bold text-lg" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>InventoryPro</span>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '0.75rem' }}>
                    <div className="sidebar-section-header">Main</div>
                    
                    <Link to="/dashboard" className={navItemClass('/dashboard')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                        <span className="sidebar-text">Dashboard</span>
                        {isCollapsed && <span className="tooltip">Dashboard</span>}
                    </Link>

                    <Link to="/products" className={navItemClass('/products')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                        <span className="sidebar-text">Products</span>
                        {isCollapsed && <span className="tooltip">Products</span>}
                    </Link>

                    <Link to="/suppliers" className={navItemClass('/suppliers')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span className="sidebar-text">Suppliers</span>
                        {isCollapsed && <span className="tooltip">Suppliers</span>}
                    </Link>

                    <Link to="/inventory" className={navItemClass('/inventory')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg>
                        <span className="sidebar-text">Inventory</span>
                        {isCollapsed && <span className="tooltip">Inventory</span>}
                    </Link>

                    <div className="sidebar-section-header">Analytics</div>

                    <Link to="/transactions" className={navItemClass('/transactions')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><path d="M2 12h20"/></svg>
                        <span className="sidebar-text">Transactions</span>
                        {isCollapsed && <span className="tooltip">Transactions</span>}
                    </Link>

                    <Link to="/reports" className={navItemClass('/reports')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        <span className="sidebar-text">Reports</span>
                        {isCollapsed && <span className="tooltip">Reports</span>}
                    </Link>

                    <div className="sidebar-section-header">System</div>

                    <Link to="/settings" className={navItemClass('/settings')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span className="sidebar-text">Settings</span>
                        {isCollapsed && <span className="tooltip">Settings</span>}
                    </Link>

                    {profile?.role === 'admin' && (
                        <Link to="/admin" className={navItemClass('/admin')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <span className="sidebar-text">Admin Panel</span>
                            {isCollapsed && <span className="tooltip">Admin Panel</span>}
                        </Link>
                    )}
                </nav>

                {/* Collapse Button + User Footer */}
                <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                    {/* User info row */}
                    {!isCollapsed && (
                        <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: 10, textDecoration: 'none', marginBottom: '0.375rem', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700
                            }}>
                                {profile?.avatar_url
                                    ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} />
                                    : userInitials
                                }
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {profile?.full_name || 'User'}
                                </p>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {profile?.role ? profile.role.toUpperCase() : 'USER'}
                                </p>
                            </div>
                        </Link>
                    )}
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-link" style={{ width: '100%' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', flexShrink: 0 }}>
                            <path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>
                        </svg>
                        <span className="sidebar-text" style={{ fontSize: '0.8125rem' }}>Collapse</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`main-content ${isCollapsed ? 'expanded' : ''}`}>
                {/* Header */}
                <header className="top-header">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileOpen(true)} className="lg:hidden btn btn-ghost p-2" style={{ color: 'var(--text-secondary)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        </button>
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{getPageTitle()}</h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Welcome back, <span className="font-medium text-slate-700 dark:text-slate-300">{profile?.full_name || 'User'}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <button onClick={toggleTheme} className="btn btn-ghost btn-sm btn-press" data-tooltip="Toggle Theme">
                            {!isDarkMode ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                            )}
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button 
                                onClick={() => {
                                    setNotificationsOpen(!notificationsOpen);
                                    if (!notificationsOpen) fetchNotifications();
                                }} 
                                className={`btn btn-ghost btn-sm btn-press relative ${lowStockCount > 0 ? 'bell-shake' : ''}`} 
                                data-tooltip="Notifications"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                                </svg>
                                {lowStockCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold text-white rounded-full flex items-center justify-center" style={{ background: 'var(--color-danger)' }}>
                                        {lowStockCount}
                                    </span>
                                )}
                            </button>

                            {notificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)}></div>
                                    <div className="dropdown-menu absolute right-0 top-full mt-2 z-20" style={{ minWidth: '320px', padding: '0' }}>
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</p>
                                            {lowStockCount > 0 && (
                                                <button 
                                                    onClick={markAllAsRead} 
                                                    style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                    No notifications
                                                </div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div 
                                                        key={n.id} 
                                                        style={{ 
                                                            padding: '0.75rem 1rem', 
                                                            borderBottom: '1px solid var(--border-light)', 
                                                            background: n.read ? 'transparent' : 'var(--bg-active)',
                                                            opacity: n.read ? 0.7 : 1,
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                                            <span style={{ 
                                                                width: '6px', 
                                                                height: '6px', 
                                                                borderRadius: '50%', 
                                                                background: n.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)',
                                                                marginTop: '6px',
                                                                flexShrink: 0,
                                                                display: n.read ? 'none' : 'block'
                                                            }}></span>
                                                            <div>
                                                                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{n.title}</p>
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.125rem 0 0 0', lineHeight: 1.3 }}>{n.message}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Menu Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)} 
                                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all" 
                                style={{ border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <span>{userInitials}</span>
                                    )}
                                </div>
                                <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--text-primary)' }}>{profile?.full_name || 'User'}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden md:block" style={{ color: 'var(--text-tertiary)' }}><path d="m6 9 6 6 6-6"/></svg>
                            </button>
                            
                            {userDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)}></div>
                                    <div className="dropdown-menu absolute right-0 top-full mt-2 z-20" style={{ minWidth: '200px' }}>
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{profile?.full_name || 'User'}</p>
                                            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{profile?.role ? profile.role.toUpperCase() : 'USER'}</p>
                                        </div>
                                        <Link to="/settings" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                                            Settings
                                        </Link>
                                        <div style={{ borderTop: '1px solid var(--border-light)' }}>
                                            <button onClick={handleLogout} className="dropdown-item danger">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Page Content Outlets */}
                <div className="content-area page-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
