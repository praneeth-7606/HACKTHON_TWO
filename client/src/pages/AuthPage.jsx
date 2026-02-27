import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Password strength calculator
function getPasswordStrength(password) {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444', className: 'weak' };
    if (score <= 2) return { score: 2, label: 'Fair', color: '#f59e0b', className: 'fair' };
    if (score <= 3) return { score: 3, label: 'Good', color: '#3b82f6', className: 'good' };
    return { score: 4, label: 'Strong', color: '#10b981', className: 'strong' };
}

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'buyer' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [animKey, setAnimKey] = useState(0);
    const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const navigate = useNavigate();

    const handleToggle = () => {
        setIsLogin(!isLogin);
        setAnimKey(k => k + 1);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check terms acceptance for signup
        if (!isLogin && !acceptedTerms) {
            setError('Please accept the Terms and Conditions to continue');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const endpoint = isLogin ? '/users/login' : '/users/signup';
            const response = await api.post(endpoint, formData);
            if (response.data.status === 'success') {
                const role = response.data.data.user.role;
                if (role === 'seller') navigate('/seller');
                else if (role === 'admin') navigate('/admin');
                else navigate('/buyer');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { value: '2,400+', label: 'Active Listings' },
        { value: '98%', label: 'Match Accuracy' },
        { value: '4.2x', label: 'Faster Closings' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* ===== LEFT PANEL ===== */}
            <div style={{
                flex: '0 0 55%', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, #020c1e 0%, #0d1f3c 50%, #071629 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px',
            }}>
                {/* Grid */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    backgroundImage: 'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }} />
                {/* Orbs */}
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0, animation: 'float 8s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0, animation: 'float 10s ease-in-out infinite reverse' }} />

                {/* Logo */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
                        }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontFamily: 'Space Grotesk', fontSize: '22px', fontWeight: '700', color: 'white' }}>EstatePulse</div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#3b82f6', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '-2px' }}>AI Powered</div>
                        </div>
                    </div>
                </div>

                {/* Main Copy */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', marginBottom: '28px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6', animation: 'pulse-glow 2s infinite' }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#60a5fa', letterSpacing: '0.5px' }}>Mistral AI — Active</span>
                    </div>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(32px, 3.5vw, 52px)', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-1.5px', color: 'white', marginBottom: '20px' }}>
                        Close Deals<br />
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>10x Faster</span>
                    </h1>
                    <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.7', maxWidth: '420px', marginBottom: '48px' }}>
                        Our AI instantly qualifies leads, scores buyer intent, and sends hyper-personalized communications — so you focus only on closing.
                    </p>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '32px' }}>
                        {stats.map((s, i) => (
                            <div key={i}>
                                <div style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: '800', color: 'white' }}>{s.value}</div>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom quote */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', fontStyle: 'italic' }}>
                            "EstatePulse AI scored our incoming buyer as 94/100 before we even picked up the phone. That lead closed in 6 days."
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white' }}>R</div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Rahul Sharma</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>Senior Agent, PropertyFirst</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== RIGHT PANEL — AUTH FORM ===== */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '48px 40px', position: 'relative',
                background: 'radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 60%), var(--bg-primary)',
            }}>
                <div key={animKey} style={{ width: '100%', maxWidth: '420px', animation: 'slide-in-up 0.4s cubic-bezier(0.16,1,0.3,1)' }}>

                    {/* Tab switcher */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '14px', padding: '4px', marginBottom: '36px' }}>
                        {['Sign In', 'Sign Up'].map((t, i) => (
                            <button key={t} onClick={() => { setIsLogin(i === 0); setAnimKey(k => k + 1); setError(''); }} style={{
                                flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                fontFamily: 'Inter', fontSize: '14px', fontWeight: '600', transition: 'all 0.25s',
                                background: (isLogin && i === 0) || (!isLogin && i === 1) ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                                color: (isLogin && i === 0) || (!isLogin && i === 1) ? 'white' : '#64748b',
                                boxShadow: (isLogin && i === 0) || (!isLogin && i === 1) ? '0 4px 16px rgba(59,130,246,0.3)' : 'none',
                            }}>{t}</button>
                        ))}
                    </div>

                    <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
                        {isLogin ? 'Sign in to your EstatePulse dashboard' : 'Join the AI-powered real estate network'}
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {!isLogin && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'slide-in-up 0.3s ease' }}>
                                {/* Name */}
                                <div style={{ position: 'relative' }}>
                                    <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#475569', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    <input className="input" style={{ paddingLeft: '44px' }} type="text" placeholder="Full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>

                                {/* Role selector */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {[
                                        { v: 'buyer', label: 'Buyer', icon: '🏡', desc: 'Find properties' },
                                        { v: 'seller', label: 'Seller', icon: '🏢', desc: 'List properties' },
                                    ].map(r => (
                                        <button type="button" key={r.v} onClick={() => setFormData({ ...formData, role: r.v })} style={{
                                            padding: '16px', borderRadius: '14px', border: `2px solid ${formData.role === r.v ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                                            background: formData.role === r.v ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                            boxShadow: formData.role === r.v ? '0 0 20px rgba(59,130,246,0.15)' : 'none',
                                        }}>
                                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{r.icon}</div>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: formData.role === r.v ? '#60a5fa' : '#94a3b8' }}>{r.label}</div>
                                            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{r.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div style={{ position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#475569', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,4 12,12 2,4" /></svg>
                            <input className="input" style={{ paddingLeft: '44px' }} type="email" placeholder="Email address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                        </div>

                        {/* Password */}
                        <div style={{ position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#475569', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            <input className="input" style={{ paddingLeft: '44px' }} type="password" placeholder={isLogin ? 'Password' : 'Password (min. 8 characters)'} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength="8" />
                        </div>
                        {/* Password Strength Meter */}
                        {!isLogin && formData.password && (
                            <div style={{ animation: 'slide-in-up 0.2s ease' }}>
                                <div className="password-strength">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`password-strength-bar ${i <= passwordStrength.score ? `filled ${passwordStrength.className}` : ''}`} />
                                    ))}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: passwordStrength.color, marginTop: '6px' }}>
                                    {passwordStrength.label}
                                </div>
                            </div>
                        )}
                        {!isLogin && (
                            <div style={{ animation: 'slide-in-up 0.3s ease' }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <input
                                        type="checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#3b82f6' }}
                                    />
                                    <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                                        I agree to the{' '}
                                        <button
                                            type="button"
                                            onClick={() => setShowTerms(true)}
                                            style={{ color: '#60a5fa', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                                        >
                                            Terms and Conditions
                                        </button>
                                        {' '}and understand the platform rules for {formData.role === 'buyer' ? 'buyers' : 'sellers'}
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '13px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: '8px' }} disabled={loading}>
                            {loading ? (
                                <><div className="loader" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Processing...</>
                            ) : (
                                <>{isLogin ? 'Sign In to Dashboard' : 'Create Account'}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></>
                            )}
                        </button>
                    </form>

                    {/* Security badges */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '28px' }}>
                        {['🔐 JWT Secured', '🔒 bcrypt Hashed', '🛡️ RBAC Control'].map(s => (
                            <div key={s} style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>{s}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Terms and Conditions Modal */}
            {showTerms && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowTerms(false)}>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: '20px', maxWidth: '700px', width: '100%', maxHeight: '80vh', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>Terms and Conditions</h3>
                            <button onClick={() => setShowTerms(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '24px', padding: '0', width: '32px', height: '32px' }}>×</button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(80vh - 140px)', color: '#94a3b8', fontSize: '14px', lineHeight: '1.7' }}>
                            <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Platform Rules and Guidelines</h4>

                            <h5 style={{ color: '#60a5fa', fontSize: '15px', fontWeight: '600', marginTop: '20px', marginBottom: '10px' }}>For All Users:</h5>
                            <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                                <li style={{ marginBottom: '8px' }}>You must be at least 18 years old to use this platform</li>
                                <li style={{ marginBottom: '8px' }}>Provide accurate and truthful information in your profile</li>
                                <li style={{ marginBottom: '8px' }}>Maintain respectful and professional communication</li>
                                <li style={{ marginBottom: '8px' }}>Do not engage in fraudulent activities or misrepresentation</li>
                                <li style={{ marginBottom: '8px' }}>Protect your account credentials and do not share them</li>
                                <li style={{ marginBottom: '8px' }}>Report any suspicious activity or violations to admin</li>
                                <li style={{ marginBottom: '8px' }}>Comply with all applicable local, state, and national laws</li>
                            </ul>

                            {formData.role === 'buyer' ? (
                                <>
                                    <h5 style={{ color: '#10b981', fontSize: '15px', fontWeight: '600', marginTop: '20px', marginBottom: '10px' }}>Buyer-Specific Rules:</h5>
                                    <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                                        <li style={{ marginBottom: '8px' }}>Complete your profile with accurate budget and location preferences</li>
                                        <li style={{ marginBottom: '8px' }}>Respond to seller inquiries in a timely manner</li>
                                        <li style={{ marginBottom: '8px' }}>Schedule property visits only if genuinely interested</li>
                                        <li style={{ marginBottom: '8px' }}>Do not waste sellers' time with fake inquiries</li>
                                        <li style={{ marginBottom: '8px' }}>Provide honest feedback after property viewings</li>
                                        <li style={{ marginBottom: '8px' }}>Respect property viewing schedules and appointments</li>
                                        <li style={{ marginBottom: '8px' }}>Do not share property details without seller permission</li>
                                        <li style={{ marginBottom: '8px' }}>Negotiate in good faith and honor commitments</li>
                                        <li style={{ marginBottom: '8px' }}>Report any issues with properties or sellers immediately</li>
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <h5 style={{ color: '#3b82f6', fontSize: '15px', fontWeight: '600', marginTop: '20px', marginBottom: '10px' }}>Seller-Specific Rules:</h5>
                                    <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                                        <li style={{ marginBottom: '8px' }}>List only properties you have legal authority to sell/rent</li>
                                        <li style={{ marginBottom: '8px' }}>Provide accurate property details, photos, and pricing</li>
                                        <li style={{ marginBottom: '8px' }}>Upload minimum 3 high-quality, recent property images</li>
                                        <li style={{ marginBottom: '8px' }}>Complete the seller Q&A section honestly and thoroughly</li>
                                        <li style={{ marginBottom: '8px' }}>All property listings require admin approval before going live</li>
                                        <li style={{ marginBottom: '8px' }}>Respond to buyer inquiries within 24 hours</li>
                                        <li style={{ marginBottom: '8px' }}>Update property status promptly (sold/rented/available)</li>
                                        <li style={{ marginBottom: '8px' }}>Do not discriminate against buyers based on protected characteristics</li>
                                        <li style={{ marginBottom: '8px' }}>Disclose all known property defects and issues</li>
                                        <li style={{ marginBottom: '8px' }}>Honor scheduled property viewings and appointments</li>
                                        <li style={{ marginBottom: '8px' }}>Do not list the same property multiple times</li>
                                        <li style={{ marginBottom: '8px' }}>Maintain property in viewable condition</li>
                                    </ul>
                                </>
                            )}

                            <h5 style={{ color: '#f59e0b', fontSize: '15px', fontWeight: '600', marginTop: '20px', marginBottom: '10px' }}>Prohibited Activities:</h5>
                            <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                                <li style={{ marginBottom: '8px' }}>Posting false, misleading, or fraudulent information</li>
                                <li style={{ marginBottom: '8px' }}>Harassment, abuse, or threatening behavior</li>
                                <li style={{ marginBottom: '8px' }}>Spam, unsolicited advertising, or promotional content</li>
                                <li style={{ marginBottom: '8px' }}>Attempting to bypass platform fees or direct transactions</li>
                                <li style={{ marginBottom: '8px' }}>Using automated bots or scripts</li>
                                <li style={{ marginBottom: '8px' }}>Scraping or copying platform content</li>
                                <li style={{ marginBottom: '8px' }}>Creating multiple accounts to manipulate the system</li>
                            </ul>

                            <h5 style={{ color: '#ef4444', fontSize: '15px', fontWeight: '600', marginTop: '20px', marginBottom: '10px' }}>Consequences of Violations:</h5>
                            <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                                <li style={{ marginBottom: '8px' }}>Warning for minor first-time violations</li>
                                <li style={{ marginBottom: '8px' }}>Temporary suspension for repeated violations</li>
                                <li style={{ marginBottom: '8px' }}>Permanent ban for serious or repeated violations</li>
                                <li style={{ marginBottom: '8px' }}>Legal action for fraudulent activities</li>
                                <li style={{ marginBottom: '8px' }}>Property listings may be rejected or removed</li>
                            </ul>

                            <h5 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginTop: '20px', marginBottom: '10px' }}>Platform Rights:</h5>
                            <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                                <li style={{ marginBottom: '8px' }}>We reserve the right to review and approve all property listings</li>
                                <li style={{ marginBottom: '8px' }}>We may suspend or terminate accounts at our discretion</li>
                                <li style={{ marginBottom: '8px' }}>We may modify these terms at any time with notice</li>
                                <li style={{ marginBottom: '8px' }}>We are not liable for disputes between buyers and sellers</li>
                                <li style={{ marginBottom: '8px' }}>We do not guarantee property availability or accuracy</li>
                            </ul>

                            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px' }}>
                                <p style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>By accepting these terms, you acknowledge that:</p>
                                <ul style={{ paddingLeft: '20px', fontSize: '13px' }}>
                                    <li style={{ marginBottom: '6px' }}>You have read and understood all platform rules</li>
                                    <li style={{ marginBottom: '6px' }}>You agree to comply with all guidelines</li>
                                    <li style={{ marginBottom: '6px' }}>You understand the consequences of violations</li>
                                    <li style={{ marginBottom: '6px' }}>You consent to admin monitoring and moderation</li>
                                </ul>
                            </div>
                        </div>
                        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    setAcceptedTerms(true);
                                    setShowTerms(false);
                                }}
                                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Accept Terms
                            </button>
                            <button
                                onClick={() => setShowTerms(false)}
                                style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid var(--border)', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
