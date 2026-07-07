import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ─── tiny hook: fires once when element enters viewport ─── */
function useInView(options = {}) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setInView(true); obs.disconnect(); }
        }, { threshold: 0.15, ...options });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return [ref, inView];
}

/* ─── animated counter ─── */
function CountUp({ end, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0);
    const [ref, inView] = useInView();
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [inView, end, duration]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Landing() {
    const { user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Interactive Demo States
    const [demoStock, setDemoStock] = useState(12);
    const [demoLogs, setDemoLogs] = useState([
        { id: 1, action: 'System initialised — ready.', qty: 12, time: '10:00:00 AM', type: 'info' }
    ]);
    const [activeFaq, setActiveFaq] = useState(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const adjustStock = (amount) => {
        const newStock = Math.max(0, demoStock + amount);
        if (newStock === demoStock) return;
        const timestamp = new Date().toLocaleTimeString();
        const actionType = amount > 0 ? 'restock' : 'dispatch';
        const logMsg = amount > 0
            ? `Restocked +${amount} units → total: ${newStock}`
            : `Dispatched ${Math.abs(amount)} units → total: ${newStock}`;
        setDemoStock(newStock);
        setDemoLogs(prev => [{ id: Date.now(), action: logMsg, qty: newStock, time: timestamp, type: actionType }, ...prev].slice(0, 6));
    };

    const features = [
        {
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg>
            ),
            color: 'indigo',
            title: 'Real-Time Stock Auditing',
            desc: 'Every movement is logged instantly, syncing across all devices via Supabase real-time subscriptions.',
        },
        {
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m14.8 9-4.8 4.8L8 11.8"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg>
            ),
            color: 'purple',
            title: 'Supplier Directories',
            desc: 'Centralise supplier profiles, lead times, and contact history to trigger bulk orders with one click.',
        },
        {
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            ),
            color: 'pink',
            title: 'Visual Analytics',
            desc: 'Interactive charts, margin analysis, and exportable reports that turn raw data into clear decisions.',
        },
        {
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            ),
            color: 'cyan',
            title: 'Granular Role Security',
            desc: 'Define team roles, view access logs, and enforce fine-grained permissions with row-level security.',
        },
        {
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            ),
            color: 'amber',
            title: 'Demand Forecasting',
            desc: 'AI-powered suggestions surface reorder points before you run out, powered by historical data trends.',
        },
        {
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            ),
            color: 'green',
            title: 'Automated Alerts',
            desc: 'Low stock, expiry, and overstock alerts delivered via in-app notifications and email the moment thresholds are crossed.',
        },
    ];

    const faqs = [
        { q: 'How easy is it to import my existing inventory?', a: 'Upload a CSV or Excel sheet, map your columns (SKU, Name, Quantity, Price, Supplier) in our importer, and thousands of products are live in under a minute.' },
        { q: 'Can I track inventory across multiple warehouses?', a: 'Yes! Professional and Enterprise plans support multi-location tracking, inter-warehouse transfers, per-location safety thresholds, and consolidated reporting.' },
        { q: 'What database does InventoryPro use?', a: 'Enterprise-grade PostgreSQL via Supabase — giving you real-time data sync, row-level security, and automated daily backups.' },
        { q: 'Can I customise roles and permissions for my team?', a: 'Absolutely. Assign Admin, Manager, or Staff roles. Staff can view and log movements; Managers can edit products; Admins have full system access.' },
        { q: 'Is there an API for integrating with our existing tools?', a: 'Our Enterprise plan includes a full REST & Webhook API, letting you push inventory events to Shopify, WooCommerce, ERPs, and custom systems.' },
    ];

    const colorMap = {
        indigo: { bg: 'rgba(99,102,241,0.12)', text: '#6366f1', darkBg: 'rgba(99,102,241,0.18)' },
        purple: { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6', darkBg: 'rgba(139,92,246,0.18)' },
        pink:   { bg: 'rgba(236,72,153,0.12)', text: '#ec4899', darkBg: 'rgba(236,72,153,0.18)' },
        cyan:   { bg: 'rgba(6,182,212,0.12)',  text: '#06b6d4', darkBg: 'rgba(6,182,212,0.18)'  },
        amber:  { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', darkBg: 'rgba(245,158,11,0.18)' },
        green:  { bg: 'rgba(16,185,129,0.12)', text: '#10b981', darkBg: 'rgba(16,185,129,0.18)' },
    };

    const integrations = [
        '🛒 Shopify', '📦 WooCommerce', '🔗 Zapier', '📊 Google Sheets',
        '📮 Mailchimp', '⚡ Make.com', '🏭 SAP', '🤖 Slack',
        '🛒 Shopify', '📦 WooCommerce', '🔗 Zapier', '📊 Google Sheets',
        '📮 Mailchimp', '⚡ Make.com', '🏭 SAP', '🤖 Slack',
    ];

    const steps = [
        { n: '01', title: 'Connect & Import', desc: 'Upload your existing stock CSV or connect directly to Shopify / WooCommerce. We map your data automatically.' },
        { n: '02', title: 'Set Smart Thresholds', desc: 'Define safety-stock levels per product. InventoryPro alerts you the instant stock dips below your target.' },
        { n: '03', title: 'Track & Grow', desc: 'Log movements, analyse trends, coordinate with suppliers, and make data-driven reorder decisions daily.' },
    ];

    return (
        <div style={{
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            backgroundColor: isDarkMode ? '#09090b' : '#f8fafc',
            color: isDarkMode ? '#f4f4f5' : '#0f172a',
            minHeight: '100vh',
            overflowX: 'hidden',
            transition: 'background-color 0.3s, color 0.3s',
        }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

                /* ── Animations ── */
                @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.08)} 66%{transform:translate(-20px,20px) scale(0.94)} }
                @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-40px,30px) scale(1.06)} 66%{transform:translate(20px,-20px) scale(0.96)} }
                @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,40px) scale(1.04)} }
                @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
                @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
                @keyframes slideIn  { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
                @keyframes ping-soft{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.4)} }
                @keyframes gridMove { 0%{background-position:0 0} 100%{background-position:40px 40px} }
                @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

                .blob1 { animation: blob1 18s infinite ease-in-out; }
                .blob2 { animation: blob2 22s infinite ease-in-out; }
                .blob3 { animation: blob3 26s infinite ease-in-out; }
                .marquee-inner { display:flex; gap:2rem; animation: marquee 24s linear infinite; width:max-content; }
                .marquee-inner:hover { animation-play-state:paused; }
                .fade-up { animation: fadeUp .6s ease both; }
                .fade-up-1 { animation: fadeUp .6s .1s ease both; }
                .fade-up-2 { animation: fadeUp .6s .2s ease both; }
                .fade-up-3 { animation: fadeUp .6s .35s ease both; }
                .demo-log-entry { animation: slideIn .28s ease both; }

                .glow-btn {
                    background: linear-gradient(135deg,#6366f1,#8b5cf6);
                    box-shadow: 0 4px 16px rgba(99,102,241,.38);
                    transition: all .22s cubic-bezier(.4,0,.2,1);
                    color: #fff;
                }
                .glow-btn:hover {
                    background: linear-gradient(135deg,#4f46e5,#7c3aed);
                    box-shadow: 0 6px 22px rgba(99,102,241,.50);
                    transform: translateY(-2px);
                }

                .ghost-btn {
                    border: 1.5px solid rgba(100,116,139,.3);
                    transition: all .2s ease;
                }
                .ghost-btn:hover {
                    border-color: #6366f1;
                    background: rgba(99,102,241,.06);
                    transform: translateY(-1px);
                }

                .glass {
                    background: ${isDarkMode ? 'rgba(24,24,27,.75)' : 'rgba(255,255,255,.75)'};
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    border: 1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'};
                }

                .feature-card {
                    transition: transform .28s ease, box-shadow .28s ease, border-color .28s ease;
                }
                .feature-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 20px 40px -12px rgba(99,102,241,.18);
                    border-color: rgba(99,102,241,.3) !important;
                }

                .ping-soft { animation: ping-soft 2.4s infinite ease-in-out; }

                /* grid hero texture */
                .hero-grid-bg {
                    background-image: linear-gradient(${isDarkMode ? 'rgba(99,102,241,.06)' : 'rgba(99,102,241,.05)'} 1px, transparent 1px),
                                      linear-gradient(90deg, ${isDarkMode ? 'rgba(99,102,241,.06)' : 'rgba(99,102,241,.05)'} 1px, transparent 1px);
                    background-size: 40px 40px;
                    animation: gridMove 6s linear infinite;
                }

                .no-scrollbar::-webkit-scrollbar { display:none; }
                .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }

                .step-connector::after {
                    content:'';
                    position:absolute;
                    top:50%;
                    right:-50%;
                    width:100%;
                    height:2px;
                    background: linear-gradient(90deg, rgba(99,102,241,.5), transparent);
                    transform:translateY(-50%);
                }

                /* gradient text */
                .grad { background: linear-gradient(135deg,#6366f1 0%,#8b5cf6 45%,#d946ef 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
            `}} />

            {/* ── Decorative blobs ── */}
            <div className="blob1" style={{ position:'fixed', top:'-15%', left:'-15%', width:600, height:600, borderRadius:'50%', background: isDarkMode ? 'radial-gradient(circle,rgba(99,102,241,.12),transparent 70%)' : 'radial-gradient(circle,rgba(99,102,241,.09),transparent 70%)', pointerEvents:'none', zIndex:0 }} />
            <div className="blob2" style={{ position:'fixed', top:'35%', right:'-12%', width:700, height:700, borderRadius:'50%', background: isDarkMode ? 'radial-gradient(circle,rgba(139,92,246,.10),transparent 70%)' : 'radial-gradient(circle,rgba(139,92,246,.07),transparent 70%)', pointerEvents:'none', zIndex:0 }} />
            <div className="blob3" style={{ position:'fixed', bottom:'-10%', left:'20%', width:550, height:550, borderRadius:'50%', background: isDarkMode ? 'radial-gradient(circle,rgba(6,182,212,.08),transparent 70%)' : 'radial-gradient(circle,rgba(6,182,212,.06),transparent 70%)', pointerEvents:'none', zIndex:0 }} />

            {/* ════════════════════════════════ HEADER ════════════════════════════════ */}
            <header style={{
                position:'sticky', top:0, zIndex:100,
                background: scrolled
                    ? (isDarkMode ? 'rgba(9,9,11,.88)' : 'rgba(248,250,252,.88)')
                    : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? `1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}` : '1px solid transparent',
                transition: 'background .3s, border-color .3s, backdrop-filter .3s',
            }}>
                <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 1.5rem', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    {/* Logo */}
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', padding:7, borderRadius:10, boxShadow:'0 2px 10px rgba(99,102,241,.3)', display:'flex' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                        </div>
                        <span style={{ fontWeight:800, fontSize:'1.05rem', letterSpacing:'-0.02em', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>InventoryPro</span>
                    </div>

                    {/* Nav links — desktop */}
                    <nav style={{ display:'flex', alignItems:'center', gap:'2rem' }} className="nav-desktop">
                        {['Features','How It Works','Pricing','FAQ'].map(l => (
                            <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} style={{ fontSize:'0.875rem', fontWeight:500, color: isDarkMode ? '#a1a1aa' : '#64748b', textDecoration:'none', transition:'color .18s' }}
                               onMouseEnter={e => e.target.style.color='#6366f1'}
                               onMouseLeave={e => e.target.style.color = isDarkMode ? '#a1a1aa' : '#64748b'}>{l}</a>
                        ))}
                    </nav>

                    {/* Right cluster */}
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        {/* Theme toggle */}
                        <button onClick={toggleTheme} aria-label="Toggle theme" style={{ padding:8, borderRadius:8, background: isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)', border:'1px solid transparent', cursor:'pointer', color: isDarkMode ? '#a1a1aa' : '#64748b', display:'flex', transition:'background .2s' }}>
                            {isDarkMode
                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                            }
                        </button>

                        {/* Hamburger — mobile only */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display:'none', padding:8, border:'none', background:'transparent', cursor:'pointer', color: isDarkMode ? '#a1a1aa' : '#64748b' }} className="hamburger">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                        </button>

                        <div className="cta-cluster" style={{ display:'flex', alignItems:'center', gap:10 }}>
                            {user ? (
                                <Link to="/dashboard" className="glow-btn" style={{ padding:'8px 20px', borderRadius:100, fontSize:'0.875rem', fontWeight:700, textDecoration:'none' }}>Dashboard →</Link>
                            ) : (
                                <>
                                    <Link to="/login" style={{ fontSize:'0.875rem', fontWeight:600, color: isDarkMode ? '#a1a1aa' : '#475569', textDecoration:'none', padding:'8px 14px' }}>Sign In</Link>
                                    <Link to="/login" className="glow-btn" style={{ padding:'8px 20px', borderRadius:100, fontSize:'0.875rem', fontWeight:700, textDecoration:'none' }}>Get Started Free</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile drawer */}
                {mobileMenuOpen && (
                    <div className="fade-up" style={{ background: isDarkMode ? '#09090b' : '#fff', borderTop:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}`, padding:'1rem 1.5rem', display:'flex', flexDirection:'column', gap:16 }}>
                        {['Features','How It Works','Pricing','FAQ'].map(l => (
                            <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} onClick={() => setMobileMenuOpen(false)} style={{ fontSize:'0.9rem', fontWeight:600, color: isDarkMode ? '#a1a1aa' : '#64748b', textDecoration:'none' }}>{l}</a>
                        ))}
                        <hr style={{ border:'none', borderTop:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}` }}/>
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="glow-btn" style={{ textAlign:'center', padding:'10px', borderRadius:12, fontSize:'0.9rem', fontWeight:700, textDecoration:'none' }}>Get Started Free</Link>
                    </div>
                )}
            </header>

            {/* ════════════════════════════════ HERO ════════════════════════════════ */}
            <section style={{ position:'relative', paddingTop:'6rem', paddingBottom:'5rem', textAlign:'center', overflow:'hidden' }}>
                {/* Animated grid background */}
                <div className="hero-grid-bg" style={{ position:'absolute', inset:0, zIndex:0, opacity:0.6 }} />
                {/* Radial fade mask */}
                <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 80% 60% at 50% 0%, transparent 40%, ${isDarkMode ? '#09090b' : '#f8fafc'} 100%)`, zIndex:1 }} />

                <div style={{ position:'relative', zIndex:2, maxWidth:900, margin:'0 auto', padding:'0 1.5rem' }}>
                    {/* Eyebrow badge */}
                    <div className="fade-up" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:100, border:`1px solid ${isDarkMode ? 'rgba(99,102,241,.35)' : 'rgba(99,102,241,.25)'}`, background: isDarkMode ? 'rgba(99,102,241,.12)' : 'rgba(99,102,241,.07)', marginBottom:28 }}>
                        <span className="ping-soft" style={{ width:7, height:7, borderRadius:'50%', background:'#6366f1', display:'inline-block' }} />
                        <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#6366f1', letterSpacing:'0.04em' }}>Real-time inventory powered by Supabase</span>
                    </div>

                    {/* Headline */}
                    <h1 className="fade-up-1" style={{ fontSize:'clamp(2.4rem, 6vw, 4.2rem)', fontWeight:900, lineHeight:1.1, letterSpacing:'-0.03em', marginBottom:24 }}>
                        Stop guessing your stock.<br />
                        <span className="grad">Start growing with data.</span>
                    </h1>

                    {/* Subline */}
                    <p className="fade-up-2" style={{ fontSize:'clamp(1rem, 2vw, 1.2rem)', color: isDarkMode ? '#a1a1aa' : '#64748b', lineHeight:1.7, maxWidth:620, margin:'0 auto 2.5rem' }}>
                        InventoryPro gives warehouses, retailers, and operations teams a real-time command centre — from intake to dispatch, every unit accounted for.
                    </p>

                    {/* CTA row */}
                    <div className="fade-up-3" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:'4rem' }}>
                        {user ? (
                            <Link to="/dashboard" className="glow-btn" style={{ padding:'13px 32px', borderRadius:100, fontSize:'1rem', fontWeight:700, textDecoration:'none' }}>Go to Dashboard →</Link>
                        ) : (
                            <>
                                <Link to="/login" className="glow-btn" style={{ padding:'13px 32px', borderRadius:100, fontSize:'1rem', fontWeight:700, textDecoration:'none' }}>Start Free Trial →</Link>
                                <a href="#how-it-works" className="ghost-btn" style={{ padding:'13px 32px', borderRadius:100, fontSize:'1rem', fontWeight:700, textDecoration:'none', color: isDarkMode ? '#e4e4e7' : '#334155', background:'transparent' }}>See How It Works</a>
                            </>
                        )}
                    </div>

                    {/* Social proof strip */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color: isDarkMode ? '#71717a' : '#94a3b8', fontSize:'0.8rem', fontWeight:600 }}>
                        <div style={{ display:'flex' }}>
                            {['#6366f1','#8b5cf6','#ec4899','#06b6d4','#10b981'].map((c,i) => (
                                <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:c, border:`2px solid ${isDarkMode ? '#09090b' : '#f8fafc'}`, marginLeft: i ? -8 : 0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:800, color:'#fff' }}>
                                    {['JS','AM','RK','LP','CW'][i]}
                                </div>
                            ))}
                        </div>
                        <div>
                            <span style={{ color:'#f59e0b' }}>★★★★★</span> &nbsp;Trusted by <b style={{ color: isDarkMode ? '#e4e4e7' : '#334155' }}>15,000+ teams</b>
                        </div>
                    </div>
                </div>

                {/* Dashboard Mockup */}
                <div style={{ maxWidth:1140, margin:'4rem auto 0', padding:'0 1.5rem', position:'relative', zIndex:2 }}>
                    <div style={{ background: isDarkMode ? 'rgba(24,24,27,.9)' : '#fff', border:`1px solid ${isDarkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'}`, borderRadius:20, boxShadow: isDarkMode ? '0 40px 80px -20px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.05)' : '0 40px 80px -20px rgba(99,102,241,.15), 0 0 0 1px rgba(99,102,241,.08)', overflow:'hidden' }}>
                        {/* Window chrome */}
                        <div style={{ padding:'14px 20px', background: isDarkMode ? 'rgba(39,39,42,.8)' : '#f1f5f9', borderBottom:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}`, display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:11, height:11, borderRadius:'50%', background:'#ef4444' }} />
                            <div style={{ width:11, height:11, borderRadius:'50%', background:'#f59e0b' }} />
                            <div style={{ width:11, height:11, borderRadius:'50%', background:'#22c55e' }} />
                            <span style={{ marginLeft:12, fontSize:'0.7rem', color: isDarkMode ? '#71717a' : '#94a3b8', fontFamily:'monospace' }}>inventorypro.app — dashboard</span>
                            <div style={{ marginLeft:'auto', width:120, height:20, borderRadius:6, background: isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)' }} />
                        </div>
                        {/* Mockup body */}
                        <div style={{ padding:'1.5rem 2rem' }}>
                            {/* KPI row */}
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
                                {[
                                    { label:'Total Stock Value', val:'$342,800', sub:'↑ 12% this month', subColor:'#10b981' },
                                    { label:'Unique SKUs', val:'1,248', sub:'Across 3 locations', subColor: isDarkMode ? '#71717a' : '#94a3b8' },
                                    { label:'Low Stock Items', val:'4', sub:'⚠ Needs attention', subColor:'#ef4444' },
                                    { label:'Pending Shipments', val:'18', sub:'12 out · 6 incoming', subColor:'#6366f1' },
                                ].map((k,i) => (
                                    <div key={i} style={{ padding:'14px 16px', borderRadius:12, background: isDarkMode ? 'rgba(255,255,255,.04)' : '#f8fafc', border:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}` }}>
                                        <p style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: isDarkMode ? '#52525b' : '#94a3b8', marginBottom:6 }}>{k.label}</p>
                                        <p style={{ fontSize:'1.5rem', fontWeight:800, color: isDarkMode ? '#f4f4f5' : '#0f172a', lineHeight:1 }}>{k.val}</p>
                                        <p style={{ fontSize:'0.68rem', marginTop:6, color:k.subColor, fontWeight:600 }}>{k.sub}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Chart + Alerts */}
                            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
                                <div style={{ padding:'16px', borderRadius:12, border:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}`, background: isDarkMode ? 'rgba(255,255,255,.02)' : '#fff' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                                        <span style={{ fontSize:'0.8rem', fontWeight:700, color: isDarkMode ? '#e4e4e7' : '#1e293b' }}>Inventory Volume — 7 Days</span>
                                        <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:6, background:'rgba(99,102,241,.1)', color:'#6366f1', fontWeight:700 }}>Live</span>
                                    </div>
                                    <div style={{ height:120, display:'flex', alignItems:'flex-end', gap:8, borderLeft:`1px solid ${isDarkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'}`, borderBottom:`1px solid ${isDarkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'}`, paddingLeft:8 }}>
                                        {[42,58,35,70,85,72,100].map((h,i) => (
                                            <div key={i} style={{ flex:1, height:`${h}%`, borderRadius:'4px 4px 0 0', background: i===6 ? 'linear-gradient(to top,#6366f1,#8b5cf6)' : isDarkMode ? 'rgba(99,102,241,.18)' : 'rgba(99,102,241,.12)', transition:'background .2s', cursor:'pointer' }} />
                                        ))}
                                    </div>
                                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                                        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                                            <span key={d} style={{ flex:1, textAlign:'center', fontSize:'0.6rem', color: isDarkMode ? '#52525b' : '#94a3b8' }}>{d}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ padding:'16px', borderRadius:12, border:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}`, background: isDarkMode ? 'rgba(255,255,255,.02)' : '#fff' }}>
                                    <span style={{ fontSize:'0.8rem', fontWeight:700, color: isDarkMode ? '#e4e4e7' : '#1e293b', display:'block', marginBottom:12 }}>Stock Alerts</span>
                                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                        {[
                                            { label:'Critical', name:'iPhone 15 Case', detail:'2 / 15 min', c:'#ef4444', bg:'rgba(239,68,68,0.08)' },
                                            { label:'Warning', name:'MX Master 3S', detail:'8 / 10 min', c:'#f59e0b', bg:'rgba(245,158,11,0.08)' },
                                            { label:'Restocked', name:'UltraWide 34"', detail:'+25 arrived', c:'#10b981', bg:'rgba(16,185,129,0.08)' },
                                        ].map((a,i) => (
                                            <div key={i} style={{ padding:'8px 10px', borderRadius:8, background:a.bg, borderLeft:`2.5px solid ${a.c}`, display:'flex', flexDirection:'column', gap:2 }}>
                                                <span style={{ fontSize:'0.6rem', fontWeight:800, color:a.c, textTransform:'uppercase' }}>{a.label}</span>
                                                <span style={{ fontSize:'0.72rem', fontWeight:700, color: isDarkMode ? '#e4e4e7' : '#1e293b' }}>{a.name}</span>
                                                <span style={{ fontSize:'0.62rem', color: isDarkMode ? '#71717a' : '#94a3b8' }}>{a.detail}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════ STATS BAND ════════════════════════════════ */}
            <section style={{ borderTop:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}`, borderBottom:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}`, padding:'3.5rem 1.5rem', background: isDarkMode ? 'rgba(255,255,255,.02)' : 'rgba(99,102,241,.02)' }}>
                <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:32, textAlign:'center' }}>
                    {[
                        { label:'Active Stock Tracked', value:4.8, suffix:'B+', prefix:'$' },
                        { label:'System Uptime', value:99.99, suffix:'%', prefix:'' },
                        { label:'Hours Saved / Month', value:45, suffix:'hrs+', prefix:'' },
                        { label:'Global Companies', value:15000, suffix:'+', prefix:'' },
                    ].map((s, i) => (
                        <div key={i}>
                            <p style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.03em', lineHeight:1 }}>
                                {s.prefix}<CountUp end={s.value} suffix={s.suffix} duration={2400} />
                            </p>
                            <p style={{ marginTop:8, fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: isDarkMode ? '#71717a' : '#94a3b8' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════ INTEGRATIONS MARQUEE ════════════════════════════════ */}
            <section style={{ padding:'3rem 0', overflow:'hidden', borderBottom:`1px solid ${isDarkMode ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'}` }}>
                <p style={{ textAlign:'center', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color: isDarkMode ? '#52525b' : '#94a3b8', marginBottom:'1.5rem' }}>Integrates with your existing tools</p>
                <div style={{ overflow:'hidden', WebkitMaskImage:'linear-gradient(90deg,transparent,black 15%,black 85%,transparent)', maskImage:'linear-gradient(90deg,transparent,black 15%,black 85%,transparent)' }}>
                    <div className="marquee-inner">
                        {integrations.map((item, i) => (
                            <div key={i} style={{ padding:'10px 24px', borderRadius:12, border:`1px solid ${isDarkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'}`, background: isDarkMode ? 'rgba(255,255,255,.03)' : '#fff', fontSize:'0.875rem', fontWeight:600, color: isDarkMode ? '#a1a1aa' : '#475569', whiteSpace:'nowrap', flexShrink:0 }}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════ FEATURES ════════════════════════════════ */}
            <section id="features" style={{ maxWidth:1280, margin:'0 auto', padding:'6rem 1.5rem' }}>
                <div style={{ textAlign:'center', maxWidth:640, margin:'0 auto 4rem' }}>
                    <span style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6366f1' }}>Platform Capabilities</span>
                    <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.15, marginTop:10, marginBottom:14 }}>
                        Built for serious inventory ops
                    </h2>
                    <p style={{ color: isDarkMode ? '#71717a' : '#64748b', lineHeight:1.7, fontSize:'1rem' }}>
                        InventoryPro packages enterprise-grade cloud tools into a clean, visual interface that any team member can use on day one.
                    </p>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
                    {features.map((f, i) => {
                        const c = colorMap[f.color];
                        return (
                            <div key={i} className="glass feature-card" style={{ borderRadius:18, padding:'1.75rem', border:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'}` }}>
                                <div style={{ width:48, height:48, borderRadius:14, background: isDarkMode ? c.darkBg : c.bg, color:c.text, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontSize:'1.05rem', fontWeight:800, marginBottom:10, letterSpacing:'-0.02em' }}>{f.title}</h3>
                                <p style={{ fontSize:'0.9rem', color: isDarkMode ? '#71717a' : '#64748b', lineHeight:1.65 }}>{f.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ════════════════════════════════ HOW IT WORKS ════════════════════════════════ */}
            <section id="how-it-works" style={{ background: isDarkMode ? 'rgba(255,255,255,.02)' : 'rgba(99,102,241,.02)', borderTop:`1px solid ${isDarkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`, borderBottom:`1px solid ${isDarkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`, padding:'6rem 1.5rem' }}>
                <div style={{ maxWidth:1100, margin:'0 auto' }}>
                    <div style={{ textAlign:'center', maxWidth:600, margin:'0 auto 4rem' }}>
                        <span style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6366f1' }}>Simple Onboarding</span>
                        <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.15, marginTop:10, marginBottom:14 }}>Up and running in 3 steps</h2>
                        <p style={{ color: isDarkMode ? '#71717a' : '#64748b', lineHeight:1.7 }}>No lengthy implementation. No consultants. Just connect and go.</p>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0, position:'relative' }}>
                        {/* Connector line */}
                        <div style={{ position:'absolute', top:40, left:'16.7%', right:'16.7%', height:2, background:`linear-gradient(90deg,rgba(99,102,241,.4),rgba(139,92,246,.4))`, zIndex:0 }} />

                        {steps.map((s, i) => (
                            <div key={i} style={{ textAlign:'center', padding:'0 2rem', position:'relative', zIndex:1 }}>
                                <div style={{ width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg,#6366f1,#8b5cf6)`, boxShadow:'0 8px 24px rgba(99,102,241,.35)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', position:'relative' }}>
                                    <span style={{ fontSize:'1.3rem', fontWeight:900, color:'#fff' }}>{s.n}</span>
                                </div>
                                <h3 style={{ fontSize:'1.1rem', fontWeight:800, marginBottom:10, letterSpacing:'-0.02em' }}>{s.title}</h3>
                                <p style={{ fontSize:'0.9rem', color: isDarkMode ? '#71717a' : '#64748b', lineHeight:1.65 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign:'center', marginTop:'3rem' }}>
                        <Link to="/login" className="glow-btn" style={{ padding:'12px 32px', borderRadius:100, fontSize:'0.95rem', fontWeight:700, textDecoration:'none', display:'inline-block' }}>Start for Free →</Link>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════ INTERACTIVE DEMO ════════════════════════════════ */}
            <section id="interactive-demo" style={{ maxWidth:1280, margin:'0 auto', padding:'6rem 1.5rem' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:64, alignItems:'center' }}>
                    {/* Left text */}
                    <div>
                        <span style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6366f1' }}>Experience It Live</span>
                        <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.5rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.15, marginTop:10, marginBottom:18 }}>Try the stock simulator right now</h2>
                        <p style={{ color: isDarkMode ? '#71717a' : '#64748b', lineHeight:1.75, marginBottom:28 }}>
                            No sign-up needed. Click the control buttons and watch quantities, status badges, and audit logs update in real time — exactly as they do inside your live dashboard.
                        </p>
                        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                            {[
                                ['Restock or Shipment', 'Increase stock levels when a supplier delivery lands.'],
                                ['Dispatch or Sale', 'Decrease stock when products leave the warehouse.'],
                                ['Low Stock Alert', 'Watch the warning badge activate below 8 units.'],
                            ].map(([title, desc], i) => (
                                <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                                    <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(99,102,241,.12)', color:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.7rem', flexShrink:0, marginTop:2 }}>{i+1}</div>
                                    <div>
                                        <p style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:3 }}>{title}</p>
                                        <p style={{ fontSize:'0.85rem', color: isDarkMode ? '#71717a' : '#64748b', lineHeight:1.5 }}>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right widget */}
                    <div className="glass" style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${isDarkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'}`, boxShadow: isDarkMode ? '0 24px 60px -10px rgba(0,0,0,.6)' : '0 24px 60px -10px rgba(99,102,241,.12)' }}>
                        {/* Widget header */}
                        <div style={{ padding:'14px 20px', background: isDarkMode ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.025)', borderBottom:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div className="ping-soft" style={{ width:8, height:8, borderRadius:'50%', background:'#10b981' }} />
                                <span style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Live Simulator</span>
                            </div>
                            <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'3px 10px', borderRadius:6, background:'rgba(99,102,241,.12)', color:'#6366f1' }}>Stock Widget</span>
                        </div>

                        <div style={{ padding:'1.5rem' }}>
                            {/* Product row */}
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}` }}>
                                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                                    <div style={{ width:58, height:58, borderRadius:14, background:'linear-gradient(135deg,#a5b4fc,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', boxShadow:'0 6px 16px rgba(99,102,241,.28)', flexShrink:0 }}>🎧</div>
                                    <div>
                                        <p style={{ fontWeight:800, fontSize:'0.95rem', marginBottom:4 }}>Elite Wireless Headset</p>
                                        <p style={{ fontSize:'0.72rem', color: isDarkMode ? '#52525b' : '#94a3b8', marginBottom:8 }}>SKU: PRO-HS-099 · Electronics</p>
                                        {demoStock <= 7 ? (
                                            <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'3px 10px', borderRadius:100, background:'rgba(239,68,68,.12)', color:'#ef4444', border:'1px solid rgba(239,68,68,.25)', display:'inline-flex', alignItems:'center', gap:5 }}>
                                                <span className="ping-soft" style={{ width:6, height:6, borderRadius:'50%', background:'#ef4444' }} />
                                                Low Stock Alert
                                            </span>
                                        ) : (
                                            <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'3px 10px', borderRadius:100, background:'rgba(16,185,129,.12)', color:'#10b981', border:'1px solid rgba(16,185,129,.25)' }}>✓ Stock Healthy</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign:'center', padding:'12px 20px', borderRadius:14, background: isDarkMode ? 'rgba(255,255,255,.05)' : 'rgba(99,102,241,.06)', border:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(99,102,241,.12)'}`, minWidth:90 }}>
                                    <p style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: isDarkMode ? '#52525b' : '#94a3b8', marginBottom:6 }}>Quantity</p>
                                    <p style={{ fontSize:'2.6rem', fontWeight:900, lineHeight:1, color: demoStock <= 7 ? '#ef4444' : '#6366f1', transition:'color .3s' }}>{demoStock}</p>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:16 }}>
                                {[['Restock +1',1,'#10b981'],['Shipment +10',10,'#6366f1'],['Dispatch -1',-1,'#f59e0b'],['Sale -5',-5,'#ef4444']].map(([label, delta, col]) => (
                                    <button key={label} onClick={() => adjustStock(delta)} style={{ padding:'10px 6px', borderRadius:10, border:`1.5px solid ${isDarkMode ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}`, background: isDarkMode ? 'rgba(255,255,255,.04)' : '#fff', color: isDarkMode ? '#e4e4e7' : '#1e293b', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', transition:'all .18s' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = col; e.currentTarget.style.background = col + '18'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'; e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,.04)' : '#fff'; }}>
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Console */}
                            <div style={{ background:'#0d1117', borderRadius:12, padding:'12px 14px', fontFamily:'monospace', border:'1px solid rgba(255,255,255,.06)' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,.08)', marginBottom:10 }}>
                                    <span style={{ fontSize:'0.65rem', color:'#4b5563', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Audit Log Console</span>
                                    <button onClick={() => setDemoLogs([{ id:1, action:'System initialised — ready.', qty:demoStock, time:new Date().toLocaleTimeString(), type:'info' }])} style={{ fontSize:'0.65rem', color:'#4b5563', background:'none', border:'none', cursor:'pointer', transition:'color .2s' }}
                                        onMouseEnter={e => e.target.style.color='#a1a1aa'}
                                        onMouseLeave={e => e.target.style.color='#4b5563'}>
                                        Clear
                                    </button>
                                </div>
                                <div className="no-scrollbar" style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:140, overflowY:'auto' }}>
                                    {demoLogs.map(log => (
                                        <div key={log.id} className="demo-log-entry" style={{ display:'flex', alignItems:'center', gap:10, fontSize:'0.7rem' }}>
                                            <span style={{ color:'#374151', flexShrink:0 }}>{log.time}</span>
                                            <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: log.type==='restock' ? '#4ade80' : log.type==='dispatch' ? '#fb923c' : '#818cf8' }}>{log.action}</span>
                                            <span style={{ color:'#374151', background:'rgba(255,255,255,.06)', padding:'1px 6px', borderRadius:4, fontSize:'0.65rem', flexShrink:0 }}>×{log.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════ TESTIMONIALS ════════════════════════════════ */}
            <section style={{ background: isDarkMode ? 'rgba(255,255,255,.02)' : 'rgba(99,102,241,.02)', borderTop:`1px solid ${isDarkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`, padding:'6rem 1.5rem' }}>
                <div style={{ maxWidth:1100, margin:'0 auto' }}>
                    <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
                        <span style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6366f1' }}>Customer Stories</span>
                        <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.5rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.15, marginTop:10, marginBottom:12 }}>What operations managers are saying</h2>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color: isDarkMode ? '#71717a' : '#94a3b8', fontSize:'0.85rem', fontWeight:600 }}>
                            <span style={{ color:'#f59e0b', fontSize:'1rem' }}>★★★★★</span>
                            <span>4.9/5 from 2,400+ verified reviews</span>
                        </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
                        {[
                            { init:'JS', grad:'#6366f1,#8b5cf6', name:'James Smith', title:'Warehouse Director · TechFlo Distribution', quote:'"Before InventoryPro we managed our $80k warehouse in Google Sheets. Stock levels were always off. After just one month, our stockouts dropped by 85%."', featured:false },
                            { init:'AM', grad:'#ec4899,#8b5cf6', name:'Alisha Miller', title:'Operations Head · Stellar Commerce', quote:'"The low stock alert system is a lifesaver. We configured safety-stock thresholds in minutes and now receive in-app alerts before we ever run short. Saved thousands on emergency supply runs."', featured:true },
                            { init:'RK', grad:'#06b6d4,#6366f1', name:'Robert K.', title:'Inventory Coordinator · NextGen Logistics', quote:'"Multiple warehouses used to mean a weekly nightmare. With InventoryPro every supplier drop and staff dispatch updates the central database immediately."', featured:false },
                        ].map((t, i) => (
                            <div key={i} className="glass" style={{ borderRadius:20, padding:'1.75rem', border: t.featured ? '2px solid rgba(99,102,241,.5)' : `1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'}`, boxShadow: t.featured ? '0 12px 36px -10px rgba(99,102,241,.25)' : 'none', position:'relative' }}>
                                {t.featured && <span style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:'0.6rem', fontWeight:800, padding:'3px 12px', borderRadius:100, textTransform:'uppercase', letterSpacing:'0.07em' }}>Featured Story</span>}
                                <div style={{ color:'#f59e0b', fontSize:'1rem', marginBottom:16 }}>★★★★★</div>
                                <p style={{ fontSize:'0.9rem', color: isDarkMode ? '#a1a1aa' : '#475569', lineHeight:1.7, marginBottom:20, fontStyle:'italic' }}>{t.quote}</p>
                                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                    <div style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg,${t.grad})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'0.72rem', flexShrink:0 }}>{t.init}</div>
                                    <div>
                                        <p style={{ fontWeight:800, fontSize:'0.9rem' }}>{t.name}</p>
                                        <p style={{ fontSize:'0.7rem', color: isDarkMode ? '#52525b' : '#94a3b8', marginTop:2 }}>{t.title}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════ PRICING ════════════════════════════════ */}
            <section id="pricing" style={{ maxWidth:1100, margin:'0 auto', padding:'6rem 1.5rem' }}>
                <div style={{ textAlign:'center', maxWidth:600, margin:'0 auto 4rem' }}>
                    <span style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6366f1' }}>Pricing</span>
                    <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.5rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.15, marginTop:10, marginBottom:14 }}>Flexible plans for growing teams</h2>
                    <p style={{ color: isDarkMode ? '#71717a' : '#64748b', lineHeight:1.7 }}>Start free. Scale as you grow. No hidden fees, cancel anytime.</p>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, alignItems:'stretch' }}>
                    {[
                        { tier:'Starter', price:'₹0', period:'/ forever', tagline:'For solopreneurs and very small teams.', highlight:false, items:['Up to 100 SKUs','1 Team Member','1 Warehouse','Basic stock log',null,''] },
                        { tier:'Professional', price:'₹2,499', period:'/ month', tagline:'Best for growing operations teams.', highlight:true, items:['Unlimited SKUs','Up to 5 Team Members','3 Warehouse locations','Automatic Low Stock Alerts','Bulk CSV Import/Export'] },
                        { tier:'Enterprise', price:'₹7,499', period:'/ month', tagline:'For corporations with complex supply chains.', highlight:false, items:['Unlimited Warehouses','Unlimited Users & Roles','Full REST & Webhook API','Dedicated Success Manager','SSO/SAML Integration'] },
                    ].map((p, i) => (
                        <div key={i} className="glass" style={{ borderRadius:20, padding:'2rem', display:'flex', flexDirection:'column', border: p.highlight ? '2px solid rgba(99,102,241,.5)' : `1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'}`, boxShadow: p.highlight ? '0 16px 48px -12px rgba(99,102,241,.28)' : 'none', position:'relative' }}>
                            {p.highlight && <span style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:'0.6rem', fontWeight:800, padding:'3px 14px', borderRadius:100, textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>Most Popular</span>}
                            <div style={{ marginBottom:24 }}>
                                <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color: isDarkMode ? '#52525b' : '#94a3b8', marginBottom:6 }}>{p.tier}</p>
                                <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:12 }}>
                                    <span style={{ fontSize:'2.8rem', fontWeight:900, letterSpacing:'-0.04em' }}>{p.price}</span>
                                    <span style={{ fontSize:'0.8rem', color: isDarkMode ? '#52525b' : '#94a3b8', fontWeight:600 }}>{p.period}</span>
                                </div>
                                <p style={{ fontSize:'0.85rem', color: isDarkMode ? '#71717a' : '#64748b', lineHeight:1.5 }}>{p.tagline}</p>
                            </div>
                            <hr style={{ border:'none', borderTop:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}`, marginBottom:20 }} />
                            <ul style={{ flex:1, display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                                {p.items.filter(Boolean).map((item, j) => (
                                    <li key={j} style={{ display:'flex', alignItems:'center', gap:10, fontSize:'0.85rem', color: isDarkMode ? '#a1a1aa' : '#475569' }}>
                                        <span style={{ color:'#10b981', fontWeight:800, fontSize:'0.9rem' }}>✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/login" className={p.highlight ? 'glow-btn' : 'ghost-btn'} style={{ display:'block', textAlign:'center', padding:'11px', borderRadius:12, fontSize:'0.875rem', fontWeight:700, textDecoration:'none', color: p.highlight ? '#fff' : (isDarkMode ? '#e4e4e7' : '#334155'), background: p.highlight ? undefined : 'transparent' }}>
                                {i === 2 ? 'Contact Sales' : i === 0 ? 'Get Started Free' : 'Start Pro Trial'}
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════ FAQ ════════════════════════════════ */}
            <section id="faq" style={{ maxWidth:820, margin:'0 auto', padding:'2rem 1.5rem 6rem' }}>
                <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
                    <span style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6366f1' }}>FAQ</span>
                    <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.5rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.15, marginTop:10 }}>Frequently asked questions</h2>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {faqs.map((faq, i) => (
                        <div key={i} className="glass" style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'}`, transition:'border-color .2s' }}>
                            <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} style={{ width:'100%', padding:'18px 22px', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', background:'transparent', border:'none', cursor:'pointer', color: isDarkMode ? '#e4e4e7' : '#0f172a', fontSize:'0.95rem', fontWeight:700 }}>
                                <span>{faq.q}</span>
                                <span style={{ transform: activeFaq === i ? 'rotate(180deg)' : 'none', transition:'transform .22s', color: isDarkMode ? '#52525b' : '#94a3b8', marginLeft:16, flexShrink:0, fontSize:'0.8rem' }}>▼</span>
                            </button>
                            {activeFaq === i && (
                                <div className="fade-up" style={{ padding:'0 22px 18px', fontSize:'0.9rem', color: isDarkMode ? '#71717a' : '#64748b', lineHeight:1.7, borderTop:`1px solid ${isDarkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'}`, paddingTop:14 }}>
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════ CTA BANNER ════════════════════════════════ */}
            <section style={{ maxWidth:1100, margin:'0 auto', padding:'0 1.5rem 6rem' }}>
                <div style={{ background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#1e1b4b 100%)', borderRadius:28, padding:'4rem 3rem', textAlign:'center', border:'1px solid rgba(99,102,241,.3)', boxShadow:'0 30px 70px -20px rgba(99,102,241,.4)', position:'relative', overflow:'hidden' }}>
                    {/* Texture overlay */}
                    <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(99,102,241,.15) 1px,transparent 1px)', backgroundSize:'30px 30px', opacity:0.6 }} />
                    <div style={{ position:'absolute', top:'20%', left:'10%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,.2),transparent 70%)', filter:'blur(40px)' }} />
                    <div style={{ position:'absolute', bottom:'10%', right:'10%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.2),transparent 70%)', filter:'blur(40px)' }} />

                    <div style={{ position:'relative', zIndex:1 }}>
                        <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.2, color:'#fff', marginBottom:16 }}>
                            Ready to bring real order to your inventory?
                        </h2>
                        <p style={{ color:'rgba(199,210,254,.75)', fontSize:'1rem', lineHeight:1.7, maxWidth:520, margin:'0 auto 2.5rem' }}>
                            Join 15,000+ companies that trust InventoryPro to keep their shelves stocked, their teams informed, and their numbers accurate.
                        </p>
                        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                            {user ? (
                                <Link to="/dashboard" className="glow-btn" style={{ padding:'13px 32px', borderRadius:100, fontSize:'1rem', fontWeight:800, textDecoration:'none' }}>Go to Dashboard →</Link>
                            ) : (
                                <>
                                    <Link to="/login" className="glow-btn" style={{ padding:'13px 32px', borderRadius:100, fontSize:'1rem', fontWeight:800, textDecoration:'none' }}>Start Free Trial →</Link>
                                    <a href="#pricing" style={{ padding:'13px 32px', borderRadius:100, fontSize:'1rem', fontWeight:800, textDecoration:'none', color:'rgba(199,210,254,.85)', border:'1.5px solid rgba(99,102,241,.4)', background:'rgba(99,102,241,.08)', transition:'all .2s' }}>View Pricing</a>
                                </>
                            )}
                        </div>
                        <p style={{ marginTop:20, fontSize:'0.78rem', color:'rgba(148,163,184,.6)', fontWeight:500 }}>No credit card required · Free 14-day trial · Cancel anytime</p>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════ FOOTER ════════════════════════════════ */}
            <footer style={{ borderTop:`1px solid ${isDarkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'}`, background: isDarkMode ? 'rgba(0,0,0,.4)' : '#f1f5f9', padding:'3.5rem 1.5rem' }}>
                <div style={{ maxWidth:1100, margin:'0 auto' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:'3rem' }}>
                        <div>
                            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:16 }}>
                                <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', padding:6, borderRadius:8, display:'flex' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
                                </div>
                                <span style={{ fontWeight:800, fontSize:'1rem', letterSpacing:'-0.02em', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>InventoryPro</span>
                            </div>
                            <p style={{ fontSize:'0.85rem', color: isDarkMode ? '#52525b' : '#94a3b8', lineHeight:1.65, maxWidth:280 }}>Smart inventory tracking, real-time audit logging, and automated stock control — built for high-efficiency operations.</p>
                            <p style={{ marginTop:16, fontSize:'0.72rem', color: isDarkMode ? '#3f3f46' : '#94a3b8' }}>v1.5.0 · Powered by Supabase</p>
                        </div>
                        {[
                            { heading:'Platform', links:[['Features','#features'],['How It Works','#how-it-works'],['Interactive Demo','#interactive-demo'],['Pricing','#pricing']] },
                            { heading:'Resources', links:[['API Docs','#'],['CSV Importer','#'],['Reports Engine','#'],['Changelog','#']] },
                            { heading:'Company', links:[['About','#'],['Blog','#'],['Careers','#'],['Contact','#']] },
                        ].map(col => (
                            <div key={col.heading}>
                                <h4 style={{ fontSize:'0.72rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color: isDarkMode ? '#3f3f46' : '#94a3b8', marginBottom:16 }}>{col.heading}</h4>
                                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                    {col.links.map(([label, href]) => (
                                        <a key={label} href={href} style={{ fontSize:'0.85rem', color: isDarkMode ? '#71717a' : '#64748b', textDecoration:'none', transition:'color .18s' }}
                                           onMouseEnter={e => e.target.style.color='#6366f1'}
                                           onMouseLeave={e => e.target.style.color = isDarkMode ? '#71717a' : '#64748b'}>{label}</a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop:`1px solid ${isDarkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`, paddingTop:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                        <p style={{ fontSize:'0.78rem', color: isDarkMode ? '#3f3f46' : '#94a3b8' }}>© 2026 InventoryPro Systems Inc. All rights reserved.</p>
                        <div style={{ display:'flex', gap:20 }}>
                            {['Privacy Policy','Terms of Use','Security'].map(l => (
                                <a key={l} href="#" style={{ fontSize:'0.78rem', color: isDarkMode ? '#3f3f46' : '#94a3b8', textDecoration:'none', transition:'color .18s' }}
                                   onMouseEnter={e => e.target.style.color='#6366f1'}
                                   onMouseLeave={e => e.target.style.color = isDarkMode ? '#3f3f46' : '#94a3b8'}>{l}</a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

            {/* ── Responsive CSS overrides ── */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media (max-width:1024px) {
                    .nav-desktop { display:none !important; }
                    .cta-cluster { display:none !important; }
                    .hamburger { display:flex !important; }
                }
                @media (max-width:768px) {
                    section > div[style*="grid-template-columns: 1fr 1.4fr"] { display:flex !important; flex-direction:column !important; }
                    section > div[style*="grid-template-columns: repeat(3,1fr)"] { grid-template-columns: 1fr !important; }
                    section > div[style*="grid-template-columns: 2fr 1fr 1fr 1fr"] { grid-template-columns: 1fr 1fr !important; }
                    section > div[style*="grid-template-columns: repeat(4,1fr)"] { grid-template-columns: 1fr 1fr !important; }
                    footer > div > div[style*="grid-template-columns: 2fr 1fr 1fr 1fr"] { grid-template-columns: 1fr 1fr !important; }
                }
            `}} />
        </div>
    );
}
