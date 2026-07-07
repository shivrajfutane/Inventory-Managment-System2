import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
    const { user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Interactive Demo Sandbox States
    const [demoStock, setDemoStock] = useState(12);
    const [demoLogs, setDemoLogs] = useState([
        { id: 1, action: 'System Init', qty: 12, time: '10:00:00 AM', type: 'info' }
    ]);
    const [activeFaq, setActiveFaq] = useState(null);

    // Dynamic stock adjuster function
    const adjustStock = (amount) => {
        const newStock = Math.max(0, demoStock + amount);
        if (newStock === demoStock) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const actionType = amount > 0 ? 'restock' : 'dispatch';
        const logMsg = amount > 0 
            ? `Restocked +${amount} units. Total: ${newStock}`
            : `Dispatched ${Math.abs(amount)} units. Total: ${newStock}`;
        
        const newLog = {
            id: Date.now(),
            action: logMsg,
            qty: newStock,
            time: timestamp,
            type: actionType
        };

        setDemoStock(newStock);
        setDemoLogs(prev => [newLog, ...prev].slice(0, 5)); // Keep last 5 logs
    };

    // FAQ items data
    const faqs = [
        {
            q: "How easy is it to import my existing inventory?",
            a: "Extremely easy. You can upload a standard CSV or Excel sheet, map your columns (SKU, Name, Quantity, Price, Supplier) in our importer tool, and import thousands of products in less than a minute."
        },
        {
            q: "Can I track inventory across multiple warehouses?",
            a: "Yes! Our Professional and Enterprise plans support multi-location tracking, enabling you to transfer stock between warehouses, set separate safety thresholds per location, and see consolidated reports."
        },
        {
            q: "What database does InventoryPro use?",
            a: "We utilize enterprise-grade PostgreSQL powered by Supabase, providing real-time data sync, secure row-level security, and high reliability with daily automated backups."
        },
        {
            q: "Can I customize roles and permissions for my team?",
            a: "Absolutely. You can assign roles such as Admin, Manager, and Staff. Staff can view stock and record movements, Managers can edit products and manage suppliers, while Admins have full access including settings and user management."
        }
    ];

    return (
        <div style={{
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            backgroundColor: 'var(--bg-body, #f8fafc)',
            color: 'var(--text-primary, #0f172a)',
            minHeight: '100vh',
            transition: 'background-color 0.3s ease, color 0.3s ease',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            {/* Custom Animations & Base Overrides Style Block */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                @keyframes float-reverse {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(20px) scale(0.95); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 0 0px rgba(99, 102, 241, 0.4); }
                    50% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
                }
                .animate-float-1 { animation: float-slow 12s infinite ease-in-out; }
                .animate-float-2 { animation: float-reverse 15s infinite ease-in-out; }
                .pulse-glow-effect { animation: pulse-glow 3s infinite ease-in-out; }
                
                .glass-card {
                    background: var(--glass-bg, rgba(255, 255, 255, 0.7));
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid var(--glass-border, rgba(0, 0, 0, 0.08));
                }
                
                .gradient-text {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .glow-btn-primary {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glow-btn-primary:hover {
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
                    transform: translateY(-2px);
                }
                
                .pricing-card-highlight {
                    border: 2px solid #6366f1;
                    box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.3);
                }
                
                .demo-log-entry {
                    animation: slideIn 0.3s ease-out forwards;
                }
                @keyframes slideIn {
                    from { transform: translateX(-15px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />

            {/* Glowing Decorative Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none animate-float-1" />
            <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-400/10 dark:bg-purple-500/5 blur-[140px] pointer-events-none animate-float-2" />
            <div className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/5 blur-[120px] pointer-events-none animate-float-1" />

            {/* ── HEADER / NAVIGATION ── */}
            <header className="sticky top-0 z-[50] w-full border-b border-slate-200/50 dark:border-zinc-800/50 backdrop-blur-md bg-white/75 dark:bg-zinc-950/75 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-2">
                        <div style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                                <path d="m3.3 7 8.7 5 8.7-5"/>
                                <path d="M12 22V12"/>
                            </svg>
                        </div>
                        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-zinc-300">
                            InventoryPro
                        </span>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
                        <a href="#demo" className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Interactive Demo</a>
                        <a href="#pricing" className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</a>
                        <a href="#faq" className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQ</a>
                    </nav>

                    {/* Right-side Utilities & CTAs */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Theme Toggle Button */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/50 dark:border-zinc-800/50 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {isDarkMode ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                            )}
                        </button>

                        {user ? (
                            <Link to="/dashboard" className="px-4 py-2 text-sm font-semibold text-white glow-btn-primary rounded-full">
                                Dashboard &rarr;
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    Sign In
                                </Link>
                                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-white glow-btn-primary rounded-full">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-2">
                        {/* Theme Toggle Button */}
                        <button 
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200/50 dark:border-zinc-800/50"
                        >
                            {isDarkMode ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                            )}
                        </button>
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-950/50 transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="4" x2="20" y1="12" y2="12"/>
                                <line x1="4" x2="20" y1="6" y2="6"/>
                                <line x1="4" x2="20" y1="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Panel */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200/50 dark:border-zinc-800/50 px-4 py-4 bg-white dark:bg-zinc-950 flex flex-col gap-4 animate-slideIn">
                        <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 py-1">Features</a>
                        <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 py-1">Interactive Demo</a>
                        <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 py-1">Pricing</a>
                        <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-indigo-600 py-1">FAQ</a>
                        <hr className="border-slate-200/50 dark:border-zinc-800/50" />
                        {user ? (
                            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 text-sm font-semibold text-white glow-btn-primary rounded-full">
                                Dashboard &rarr;
                            </Link>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 text-sm font-semibold border border-slate-200 dark:border-zinc-800 rounded-full text-slate-700 dark:text-zinc-300">
                                    Sign In
                                </Link>
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 text-sm font-semibold text-white glow-btn-primary rounded-full">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* ── HERO SECTION ── */}
            <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
                {/* Badge Notification */}
                <div className="mb-6 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/20 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 pulse-glow-effect" />
                    Real-time stock management powered by Supabase
                </div>

                {/* Main Heading */}
                <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6.5xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white mb-6">
                    Supercharge Your Inventory.<br className="hidden sm:inline" />
                    <span className="gradient-text">Empower Your Team.</span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-2xl text-base sm:text-lg md:text-xl text-slate-600 dark:text-zinc-400 leading-relaxed mb-10">
                    InventoryPro is a state-of-the-art management system featuring instant stock audits, automated tracking levels, intelligent analytics, and real-time cloud backup. 
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center w-full sm:w-auto">
                    {user ? (
                        <Link to="/dashboard" className="px-8 py-3.5 text-base font-semibold text-white glow-btn-primary rounded-full flex items-center justify-center gap-2">
                            Go to Dashboard &rarr;
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="px-8 py-3.5 text-base font-semibold text-white glow-btn-primary rounded-full flex items-center justify-center gap-2">
                                Start Free Trial &rarr;
                            </Link>
                            <a href="#demo" className="px-8 py-3.5 text-base font-semibold border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all text-slate-700 dark:text-zinc-200 flex items-center justify-center">
                                Try Interactive Demo
                            </a>
                        </>
                    )}
                </div>

                {/* CSS Animated Dashboard Mockup Preview */}
                <div className="w-full max-w-5xl mx-auto rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-2xl p-2 bg-slate-100/50 dark:bg-zinc-900/40 backdrop-blur-xl">
                    <div className="rounded-xl overflow-hidden border border-slate-200/50 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 md:p-6 text-left">
                        {/* Mock header row */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-900 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="ml-2 text-xs text-slate-400 font-mono">dashboard_preview.app</span>
                            </div>
                            <div className="h-6 w-32 rounded bg-slate-100 dark:bg-zinc-900 animate-pulse" />
                        </div>

                        {/* Mock grid blocks */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="border border-slate-100 dark:border-zinc-900 rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/20">
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Stock Value</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">$342,800</p>
                                <span className="text-[10px] text-green-500 flex items-center mt-1">&uarr; 12% from last month</span>
                            </div>
                            <div className="border border-slate-100 dark:border-zinc-900 rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/20">
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Unique SKUs</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">1,248</p>
                                <span className="text-[10px] text-slate-400 flex items-center mt-1">Across 3 warehouses</span>
                            </div>
                            <div className="border border-slate-100 dark:border-zinc-900 rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/20">
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Low Stock Items</p>
                                <p className="text-2xl font-bold text-red-500 mt-1">4</p>
                                <span className="text-[10px] text-red-500/80 flex items-center mt-1 font-medium">&#9888; Requires action</span>
                            </div>
                            <div className="border border-slate-100 dark:border-zinc-900 rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/20">
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pending Shipments</p>
                                <p className="text-2xl font-bold text-indigo-500 mt-1">18</p>
                                <span className="text-[10px] text-indigo-500/80 flex items-center mt-1">12 dispatch, 6 incoming</span>
                            </div>
                        </div>

                        {/* Mock Chart & Recent Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 border border-slate-100 dark:border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Inventory Volume Over Time</h4>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300">Live Sync</span>
                                </div>
                                {/* Simulated Chart Graphics */}
                                <div className="h-36 flex items-end gap-2.5 pt-4 border-b border-l border-slate-100 dark:border-zinc-900 pl-2">
                                    <div className="w-full bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t h-[40%] hover:bg-indigo-500/30 transition-all duration-200 cursor-pointer" />
                                    <div className="w-full bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t h-[55%] hover:bg-indigo-500/30 transition-all duration-200 cursor-pointer" />
                                    <div className="w-full bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t h-[30%] hover:bg-indigo-500/30 transition-all duration-200 cursor-pointer" />
                                    <div className="w-full bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t h-[65%] hover:bg-indigo-500/30 transition-all duration-200 cursor-pointer" />
                                    <div className="w-full bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t h-[80%] hover:bg-indigo-500/30 transition-all duration-200 cursor-pointer" />
                                    <div className="w-full bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t h-[70%] hover:bg-indigo-500/30 transition-all duration-200 cursor-pointer" />
                                    <div className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t h-[95%] hover:opacity-90 transition-all duration-200 cursor-pointer" />
                                </div>
                            </div>
                            <div className="border border-slate-100 dark:border-zinc-900 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Stock Alerts</h4>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start gap-3 p-2 rounded bg-red-50/50 dark:bg-red-950/10 border-l-2 border-red-500">
                                        <div className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Critical</div>
                                        <div style={{ flex: 1 }}>
                                            <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 leading-tight">iPhone 15 Case</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Stock level: 2 units (Min: 15)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-2 rounded bg-yellow-50/50 dark:bg-yellow-950/10 border-l-2 border-yellow-500">
                                        <div className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 px-1.5 py-0.5 rounded font-bold uppercase">Warning</div>
                                        <div style={{ flex: 1 }}>
                                            <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 leading-tight">Logitech MX Master 3S</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Stock level: 8 units (Min: 10)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-2 rounded bg-green-50/50 dark:bg-green-950/10 border-l-2 border-green-500">
                                        <div className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase">Restocked</div>
                                        <div style={{ flex: 1 }}>
                                            <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 leading-tight">UltraWide Monitor 34"</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Supplier completed: +25 units</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRUST STATS SECTION ── */}
            <section className="bg-slate-100/50 dark:bg-zinc-900/30 border-y border-slate-200/50 dark:border-zinc-800/50 py-10 md:py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    <div>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">$4.8B+</p>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-2">Active Stock Tracked</p>
                    </div>
                    <div>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">99.99%</p>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-2">System Uptime Guarantee</p>
                    </div>
                    <div>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">45 hrs+</p>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-2">Saved / Employee Monthly</p>
                    </div>
                    <div>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">15,000+</p>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-2">Global Companies Supported</p>
                    </div>
                </div>
            </section>

            {/* ── FEATURES SECTION ── */}
            <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Unmatched Capabilities</h2>
                    <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
                        Engineered for High-Performance Stock Ops
                    </p>
                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed text-sm sm:text-base">
                        InventoryPro packages advanced cloud tools into a seamless, visual interface that team members can use out-of-the-box.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Feature 1 */}
                    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:border-indigo-500/35">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center mb-5">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Real-Time Stock Auditing</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                            Log movements, track stock quantities instantly, and sync across all devices via secure Supabase integration.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:border-indigo-500/35">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center mb-5">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m14.8 9-4.8 4.8L8 11.8"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Supplier Directories</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                            Organize supplier profiles, record contact histories, track replenishment lead times, and trigger bulk email orders.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:border-indigo-500/35">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 flex items-center justify-center mb-5">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Visual Reporting</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                            Render beautiful interactive charts, export inventory sheets, monitor sales volume, and analyze margin metrics.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:border-indigo-500/35">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center mb-5">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Granular Role Security</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                            Manage user profiles, define team roles, view access logs, and enforce multi-factor security locks.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── INTERACTIVE LIVE SANDBOX SECTION ── */}
            <section id="demo" className="py-20 md:py-28 bg-slate-100/30 dark:bg-zinc-950/20 border-y border-slate-200/50 dark:border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left explanation text */}
                    <div className="lg:col-span-5">
                        <h2 className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Experience It Live</h2>
                        <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-6">
                            Interact with the Stock Simulator
                        </h3>
                        <p className="text-slate-600 dark:text-zinc-400 leading-relaxed mb-6">
                            See how inventory levels and logging actions sync instantly. In the simulator to the right, try refilling the warehouse or dispatching orders. Notice how the safety alert updates immediately when stock drops below 8.
                        </p>
                        
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold">1</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium">Click Restock to increase quantities when shipments arrive.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold">2</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium">Click Dispatch to simulate product sales and deliveries.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold">3</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium">Watch the low stock alert toggle on and off automatically.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right interactive widget box */}
                    <div className="lg:col-span-7">
                        <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 shadow-xl overflow-hidden bg-white dark:bg-zinc-950">
                            {/* Widget Header */}
                            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200/50 dark:border-zinc-800/50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">Interactive Simulator</span>
                                </div>
                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded">Stock Widget</span>
                            </div>

                            {/* Widget Body */}
                            <div className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-zinc-900 pb-8">
                                    {/* Simulated Product Card */}
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #a5b4fc, #6366f1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '1.5rem',
                                            fontWeight: 750,
                                            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
                                        }}>
                                            🎧
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-base">Elite Wireless Headset</p>
                                            <p className="text-xs text-slate-400 mt-0.5">SKU: PRO-HS-099 &bull; Cat: Electronics</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                {demoStock <= 7 ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-900/30 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                                        Low Stock Alert
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full border border-green-200 dark:border-green-900/30">
                                                        Stock Healthy
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Counter UI */}
                                    <div className="text-center bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-900 p-4 rounded-xl min-w-[120px] w-full md:w-auto">
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Quantity</p>
                                        <p className={`text-4xl font-extrabold mt-1 transition-all ${demoStock <= 7 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                            {demoStock}
                                        </p>
                                    </div>
                                </div>

                                {/* Controller Buttons */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                    <button 
                                        onClick={() => adjustStock(1)}
                                        className="py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-colors"
                                    >
                                        Restock (+1)
                                    </button>
                                    <button 
                                        onClick={() => adjustStock(10)}
                                        className="py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-colors"
                                    >
                                        Shipment (+10)
                                    </button>
                                    <button 
                                        onClick={() => adjustStock(-1)}
                                        className="py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-colors"
                                    >
                                        Dispatch (-1)
                                    </button>
                                    <button 
                                        onClick={() => adjustStock(-5)}
                                        className="py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-colors"
                                    >
                                        Sale (-5)
                                    </button>
                                </div>

                                {/* Terminal Console Log */}
                                <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-950">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Audit Logs Console</span>
                                        <button 
                                            onClick={() => setDemoLogs([{ id: 1, action: 'System Init', qty: demoStock, time: new Date().toLocaleTimeString(), type: 'info' }])}
                                            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            Clear Console
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto no-scrollbar">
                                        {demoLogs.map((log) => (
                                            <div key={log.id} className="demo-log-entry flex items-center justify-between gap-4">
                                                <span className="text-[10px] text-slate-500">{log.time}</span>
                                                <span style={{
                                                    flex: 1,
                                                    color: log.type === 'restock' ? '#4ade80' : log.type === 'dispatch' ? '#fb7185' : '#818cf8',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {log.action}
                                                </span>
                                                <span className="font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                                                    QTY: {log.qty}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CLIENT TESTIMONIALS SECTION ── */}
            <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Case Studies</h2>
                    <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
                        What Operations Managers Are Saying
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Review 1 */}
                    <div className="glass-card rounded-2xl p-6 relative">
                        <div className="flex items-center gap-1 text-amber-500 mb-4">
                            <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 italic">
                            "Before InventoryPro, we were managing our $80k warehouse with basic Google sheets. Stock levels were constantly out of sync. After implementing this tool, our stockouts dropped by 85% in the first month."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs">
                                JS
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">James Smith</h4>
                                <p className="text-[10px] text-slate-400">Warehouse Director &bull; TechFlo Distribution</p>
                            </div>
                        </div>
                    </div>

                    {/* Review 2 */}
                    <div className="glass-card rounded-2xl p-6 relative pricing-card-highlight">
                        <span className="absolute top-[-12px] right-[20px] bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Featured Story</span>
                        <div className="flex items-center gap-1 text-amber-500 mb-4">
                            <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 italic">
                            "The low stock alert system is an absolute lifesaver. We configured our safety stock quantities in the dashboard, and now we receive automatic in-app alerts before we ever run short. It saved us thousands in emergency supply runs."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs">
                                AM
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Alisha Miller</h4>
                                <p className="text-[10px] text-slate-400">Operations Head &bull; Stellar Commerce</p>
                            </div>
                        </div>
                    </div>

                    {/* Review 3 */}
                    <div className="glass-card rounded-2xl p-6 relative">
                        <div className="flex items-center gap-1 text-amber-500 mb-4">
                            <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 italic">
                            "Having multiple warehouses meant stock counting was a weekly nightmare. With the real-time sync in InventoryPro, every supplier drop and staff dispatch updates the centralized database immediately. Incredible tool!"
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                                RK
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Robert K.</h4>
                                <p className="text-[10px] text-slate-400">Inventory Coordinator &bull; NextGen Logistics</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PRICING SECTION ── */}
            <section id="pricing" className="py-20 md:py-28 bg-slate-100/30 dark:bg-zinc-950/20 border-t border-slate-200/50 dark:border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Pricing Tiers</h2>
                        <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
                            Flexible Plans for Growing Teams
                        </h3>
                        <p className="text-slate-500 dark:text-zinc-400 leading-relaxed text-sm sm:text-base">
                            Start for free and scale smoothly as you expand. No hidden transaction fees, upgrade or downgrade anytime.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
                        {/* Plan 1 */}
                        <div className="glass-card rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px]">
                            <div>
                                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Starter</h4>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Free Trial</h3>
                                <div className="my-6">
                                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
                                    <span className="text-xs text-slate-400 ml-1">/ forever</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                                    Perfect for small teams and solopreneurs looking to structure basic stock levels.
                                </p>
                                <hr className="border-slate-100 dark:border-zinc-900 mb-6" />
                                <ul className="flex flex-col gap-3 text-xs text-slate-600 dark:text-zinc-400">
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Up to 100 SKUs</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 1 Team Member</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 1 Location tracking</li>
                                    <li className="flex items-center gap-2 text-slate-400"><span className="text-slate-400">&#10007;</span> Automatic alerts</li>
                                    <li className="flex items-center gap-2 text-slate-400"><span className="text-slate-400">&#10007;</span> CSV exports</li>
                                </ul>
                            </div>
                            <Link to="/login" className="w-full text-center py-2.5 mt-8 text-xs font-bold border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                                Get Started Free
                            </Link>
                        </div>

                        {/* Plan 2 */}
                        <div className="glass-card rounded-2xl p-8 flex flex-col justify-between pricing-card-highlight relative transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px]">
                            <span className="absolute top-[-12px] left-[50%] translate-x-[-50%] bg-indigo-650 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
                            <div>
                                <h4 className="text-indigo-550 text-xs font-bold uppercase tracking-widest mb-1">Standard</h4>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Professional</h3>
                                <div className="my-6">
                                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$29</span>
                                    <span className="text-xs text-slate-400 ml-1">/ month</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                                    Best for operations teams who need real-time alerts, detailed audits, and multi-user support.
                                </p>
                                <hr className="border-slate-100 dark:border-zinc-900 mb-6" />
                                <ul className="flex flex-col gap-3 text-xs text-slate-600 dark:text-zinc-400">
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Unlimited SKUs & Items</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Up to 5 Team Members</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 3 Warehouse locations</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Automatic Low Stock Alerts</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Bulk CSV Import/Export</li>
                                </ul>
                            </div>
                            <Link to="/login" className="w-full text-center py-2.5 mt-8 text-xs font-bold text-white glow-btn-primary rounded-lg">
                                Start Pro Trial
                            </Link>
                        </div>

                        {/* Plan 3 */}
                        <div className="glass-card rounded-2xl p-8 flex flex-col justify-between transition-all duration-350 hover:shadow-xl hover:translate-y-[-4px]">
                            <div>
                                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Scale</h4>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Enterprise</h3>
                                <div className="my-6">
                                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$89</span>
                                    <span className="text-xs text-slate-400 ml-1">/ month</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                                    Tailored solution for multi-warehouse corporations requiring advanced API access and audits.
                                </p>
                                <hr className="border-slate-100 dark:border-zinc-900 mb-6" />
                                <ul className="flex flex-col gap-3 text-xs text-slate-600 dark:text-zinc-400">
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Unlimited Warehouses</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Unlimited Users & Roles</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Full REST & Webhook APIs</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Dedicated Success Manager</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> SSO/SAML Security Integration</li>
                                </ul>
                            </div>
                            <Link to="/login" className="w-full text-center py-2.5 mt-8 text-xs font-bold border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ SECTION ── */}
            <section id="faq" className="py-20 md:py-28 max-w-4xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Common Inquiries</h2>
                    <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
                        Frequently Asked Questions
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    {faqs.map((faq, index) => (
                        <div 
                            key={index}
                            className="glass-card rounded-xl border border-slate-200/50 dark:border-zinc-800/50 overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                                className="w-full px-6 py-5 text-left flex items-center justify-between text-slate-900 dark:text-white hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 font-bold text-sm sm:text-base transition-colors"
                            >
                                <span>{faq.q}</span>
                                <span className={`text-xs text-slate-400 transform transition-transform duration-200 ${activeFaq === index ? 'rotate-180' : ''}`}>
                                    &#9660;
                                </span>
                            </button>
                            
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeFaq === index ? 'max-h-[250px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <p className="px-6 pb-6 text-sm text-slate-500 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-900 pt-4 bg-slate-50/20 dark:bg-zinc-900/5">
                                    {faq.a}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CALL TO ACTION BANNER ── */}
            <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 text-white p-8 md:p-14 border border-indigo-500/20 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
                    {/* Glowing mesh background */}
                    <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />
                    
                    <h2 className="text-2xl sm:text-3.5xl font-extrabold max-w-2xl leading-snug mb-4">
                        Ready to Bring Order, Visibility, and Speed to Your Inventory?
                    </h2>
                    <p className="text-indigo-200 text-sm sm:text-base max-w-xl leading-relaxed mb-8">
                        Join thousands of warehouse coordinators, retail shops, and distribution hubs. Setup in 2 minutes. Free trial.
                    </p>
                    
                    {user ? (
                        <Link to="/dashboard" className="px-8 py-3.5 text-base font-semibold text-white glow-btn-primary rounded-full">
                            Go to Dashboard &rarr;
                        </Link>
                    ) : (
                        <Link to="/login" className="px-8 py-3.5 text-base font-semibold text-white glow-btn-primary rounded-full">
                            Get Started Free &rarr;
                        </Link>
                    )}
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-slate-200/50 dark:border-zinc-800/50 bg-slate-50 dark:bg-zinc-950/40 py-12 md:py-16 mt-12 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
                    {/* Brand Info */}
                    <div className="md:col-span-4 flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <div style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                padding: '5px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                                </svg>
                            </div>
                            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                                InventoryPro
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed">
                            Smart inventory tracking, real-time audit logging, and automated safety stock control. Designed for high efficiency distribution channels.
                        </p>
                        <span className="text-[10px] text-slate-400/80 dark:text-zinc-600">
                            Build v1.4.0 &bull; Supabase Database
                        </span>
                    </div>

                    {/* Quick Link Directories */}
                    <div className="md:col-span-2 flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Platform</h4>
                        <a href="#features" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400">Features</a>
                        <a href="#demo" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400">Sim Demo</a>
                        <a href="#pricing" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400">Pricing Plan</a>
                    </div>
                    
                    <div className="md:col-span-2 flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Resources</h4>
                        <Link to="/login" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400">API Documentation</Link>
                        <Link to="/login" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400">Supplier Setup</Link>
                        <Link to="/login" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400">Reports Engine</Link>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Contact Support</h4>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 leading-normal">
                            Need help setting up your warehouses or importing products? Contact support operations.
                        </p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                            support@inventorypro.io &bull; +1 (800) 555-PRO
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/50 dark:border-zinc-900 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                        &copy; 2026 InventoryPro Systems Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link to="/login" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-600">Privacy Policy</Link>
                        <Link to="/login" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-600">Terms of Use</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
