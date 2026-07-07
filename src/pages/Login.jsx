import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── Icons ───────────────────────────────────────────────────── */
const IconEmail = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);
const IconGoogle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.83z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.39 24 12 24z"/>
        <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 4.9 12c0-.79.13-1.57.32-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.11-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 5.61l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z"/>
    </svg>
);
const Spinner = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        style={{ animation: 'lspin .8s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);

/* ── OTP digit row ───────────────────────────────────────────── */
const OtpInput = ({ value, onChange, disabled }) => {
    const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

    const handleChange = (i, e) => {
        const ch = e.target.value.replace(/\D/g, '');
        if (!ch) {
            const next = [...digits]; next[i] = '';
            onChange(next.join(''));
            if (i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
        } else {
            const next = [...digits]; next[i] = ch.slice(-1);
            onChange(next.join(''));
            if (i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(p.padEnd(6, '').slice(0, 6).split('').map((c, i) => p[i] || '').join(''));
        document.getElementById(`otp-${Math.min(p.length, 5)}`)?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) {
            document.getElementById(`otp-${i - 1}`)?.focus();
        }
    };

    return (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {digits.map((d, i) => (
                <input
                    key={i} id={`otp-${i}`}
                    type="text" inputMode="numeric" maxLength={1}
                    value={d} disabled={disabled}
                    onChange={e => handleChange(i, e)}
                    onPaste={handlePaste}
                    onKeyDown={e => handleKeyDown(i, e)}
                    style={{
                        width: 42, height: 48, textAlign: 'center',
                        fontSize: '1.25rem', fontWeight: 700, letterSpacing: 0,
                        background: d ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-body, #fafafa)',
                        border: `2px solid ${d ? 'var(--color-primary-500, #8b5cf6)' : 'var(--border-medium, #d4d4d8)'}`,
                        borderRadius: '8px', color: 'var(--text-primary, #09090b)',
                        outline: 'none', transition: 'all .15s',
                        cursor: disabled ? 'not-allowed' : 'text',
                        fontFamily: 'monospace',
                    }}
                    onFocus={e => {
                        e.target.style.borderColor = 'var(--color-primary-500, #8b5cf6)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)';
                    }}
                    onBlur={e => {
                        e.target.style.borderColor = d ? 'var(--color-primary-500,#8b5cf6)' : 'var(--border-medium,#d4d4d8)';
                        e.target.style.boxShadow = 'none';
                    }}
                />
            ))}
        </div>
    );
};

/* ── Login page ──────────────────────────────────────────────── */
export default function Login() {
    const { sendOtp, verifyOtp, loginWithGoogle, user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [step, setStep] = useState('email');   // 'email' | 'otp'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

    // While auth is still resolving, show a neutral spinner so the
    // login form never flashes for an already-authenticated user.
    if (authLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body, #fafafa)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round"
                    style={{ animation: 'lspin .8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <style>{`@keyframes lspin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!email) { showToast('Enter your email', 'error'); return; }
        setLoading(true);
        const res = await sendOtp(email);
        setLoading(false);
        if (res.success) {
            setStep('otp'); setCooldown(60); setOtp('');
            showToast('Code sent! Check your inbox.', 'success');
            setTimeout(() => document.getElementById('otp-0')?.focus(), 120);
        } else {
            showToast(res.error || 'Failed to send code', 'error');
        }
    };

    const handleVerify = async (e) => {
        e?.preventDefault();
        const clean = otp.replace(/\s/g, '');
        if (clean.length < 6) { showToast('Enter all 6 digits', 'error'); return; }
        setLoading(true);
        const res = await verifyOtp(email, clean);
        if (res.success) {
            showToast('Signed in!', 'success');
            navigate('/dashboard');
        } else {
            showToast(res.error || 'Invalid code', 'error');
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        const res = await loginWithGoogle();
        if (!res.success) { showToast(res.error || 'Google login failed', 'error'); setLoading(false); }
    };

    /* shared input style */
    const inputStyle = {
        width: '100%', boxSizing: 'border-box',
        padding: '0.6rem 0.875rem 0.6rem 2.4rem',
        background: 'var(--bg-body, #fafafa)',
        border: '1.5px solid var(--border-medium, #d4d4d8)',
        borderRadius: '8px', fontSize: '0.875rem',
        color: 'var(--text-primary, #09090b)', outline: 'none',
        transition: 'border-color .15s, box-shadow .15s',
    };

    const btnStyle = (primary = true) => ({
        width: '100%', padding: '0.625rem 1rem',
        borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
        border: primary ? 'none' : '1.5px solid var(--border-medium, #d4d4d8)',
        background: primary
            ? 'linear-gradient(135deg, var(--color-primary-600,#7c3aed), var(--color-primary-700,#6d28d9))'
            : 'var(--bg-card, #fff)',
        color: primary ? '#fff' : 'var(--text-primary, #09090b)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.65 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        transition: 'filter .15s',
        boxShadow: primary ? '0 1px 4px rgba(109,40,217,.25)' : 'none',
    });

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-body, #fafafa)', fontFamily: 'Inter, system-ui, sans-serif',
            padding: '1.5rem',
        }}>
            {/* card */}
            <div style={{
                width: '100%', maxWidth: 360,
                background: 'var(--bg-card, #fff)',
                border: '1px solid var(--border-light, #e4e4e7)',
                borderRadius: '14px', padding: '2rem',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}>

                {/* logo */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <img src="/logo.png" alt="InventoryPro Logo" style={{ width: '48px', height: '48px', borderRadius: '10px', marginBottom: '0.625rem', objectFit: 'cover' }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary,#09090b)' }}>InventoryPro</p>
                </div>

                {/* ── STEP: EMAIL ── */}
                {step === 'email' && (
                    <>
                        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary,#09090b)', textAlign: 'center' }}>
                            Welcome back
                        </h1>
                        <p style={{ margin: '0 0 1.25rem', fontSize: '0.8125rem', color: 'var(--text-tertiary,#a1a1aa)', textAlign: 'center' }}>
                            Sign in with your email
                        </p>

                        {/* Google */}
                        <button onClick={handleGoogle} disabled={loading} style={btnStyle(false)}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--bg-hover,#f4f4f5)'; }}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card,#fff)'}>
                            <IconGoogle /> Continue with Google
                        </button>

                        {/* divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                            <div style={{ flex: 1, borderTop: '1px solid var(--border-light,#e4e4e7)' }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary,#a1a1aa)' }}>or</span>
                            <div style={{ flex: 1, borderTop: '1px solid var(--border-light,#e4e4e7)' }} />
                        </div>

                        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label htmlFor="login-email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary,#52525b)', marginBottom: '0.3rem' }}>
                                    Email address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary,#a1a1aa)', display: 'flex' }}>
                                        <IconEmail />
                                    </span>
                                    <input id="login-email" type="email" placeholder="you@company.com"
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        autoComplete="email" required style={inputStyle}
                                        onFocus={e => { e.target.style.borderColor = 'var(--color-primary-500,#8b5cf6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,.12)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'var(--border-medium,#d4d4d8)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading || !email} style={btnStyle(true)}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.07)'; }}
                                onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                                {loading ? <><Spinner /> Sending…</> : 'Send code →'}
                            </button>
                        </form>
                    </>
                )}

                {/* ── STEP: OTP ── */}
                {step === 'otp' && (
                    <>
                        {/* back */}
                        <button onClick={() => { setStep('email'); setOtp(''); }} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-tertiary,#a1a1aa)', display: 'flex',
                            alignItems: 'center', gap: '4px', fontSize: '0.8rem',
                            padding: 0, marginBottom: '1rem',
                        }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                            Back
                        </button>

                        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary,#09090b)', textAlign: 'center' }}>
                            Enter your code
                        </h1>
                        <p style={{ margin: '0 0 1.5rem', fontSize: '0.8125rem', color: 'var(--text-tertiary,#a1a1aa)', textAlign: 'center' }}>
                            Sent to <strong style={{ color: 'var(--text-secondary,#52525b)' }}>{email}</strong>
                        </p>

                        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <OtpInput value={otp} onChange={setOtp} disabled={loading} />

                            <button type="submit" disabled={loading || otp.replace(/\s/g,'').length < 6} style={btnStyle(true)}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.07)'; }}
                                onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                                {loading ? <><Spinner /> Verifying…</> : 'Verify & Sign in'}
                            </button>
                        </form>

                        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary,#a1a1aa)', marginBottom: 0 }}>
                            {cooldown > 0
                                ? `Resend in ${cooldown}s`
                                : <button type="button" onClick={handleSend} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600,#7c3aed)', fontWeight: 600, fontSize: '0.8rem', padding: 0 }}>
                                    Resend code
                                  </button>
                            }
                        </p>
                    </>
                )}
            </div>

            <style>{`@keyframes lspin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
