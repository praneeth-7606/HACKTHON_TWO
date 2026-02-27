import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const SavedProperties = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userRes = await api.get('/users/me');
            setUser(userRes.data.data.user);

            const propsRes = await api.get('/properties/saved/me');
            setProperties(propsRes.data.data.properties || []);
        } catch (err) {
            console.error('Error loading saved properties:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (propertyId, e) => {
        e.stopPropagation();
        try {
            await api.post(`/properties/${propertyId}/save`);
            setProperties(properties.filter(p => p._id !== propertyId));
        } catch (err) {
            alert('Failed to remove property');
        }
    };

    const priceAbbr = (n) => {
        if (!n) return '—';
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
        return `₹${n.toLocaleString()}`;
    };

    return (
        <div style={{ background: 'radial-gradient(ellipse at 10% 20%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(139,92,246,0.06) 0%, transparent 50%), #0a1628', minHeight: '100vh' }}>
            <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)', backgroundSize: '56px 56px', zIndex: 0, pointerEvents: 'none' }} />

            <Navbar user={user} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div initial={{ x: -260, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -260, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="sidebar" style={{ top: '64px' }}>
                        <div style={{ padding: '20px 16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'white', fontWeight: '800', marginBottom: '16px' }}>
                                {user?.name?.[0]?.toUpperCase() || 'B'}
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{user?.name || 'Buyer Account'}</div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{user?.profession || 'Verified Buyer'}</div>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 16px' }} />
                        {[
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>, label: '🔍 Smart Search', action: () => navigate('/search'), highlight: true },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, label: 'Messages', action: () => navigate('/messages') },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, label: 'My Profile', action: () => navigate('/profile') },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>, label: 'Saved', active: true, action: () => { } },
                        ].map(item => (
                            <button key={item.label} className={`sidebar-item ${item.active ? 'active' : ''}`} onClick={item.action} style={item.highlight ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' } : {}}>
                                {item.icon}{item.label}
                            </button>
                        ))}
                        <div style={{ flex: 1 }} />
                        <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', margin: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase' }}>Saved Collection</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.5' }}>Your bookmarked properties for quick access.</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="main-content">
                <div style={{ padding: '48px 40px 60px', maxWidth: '1440px', margin: '0 auto' }}>
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '48px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', marginBottom: '20px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#f59e0b' }}>
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', letterSpacing: '0.5px' }}>Your Saved Collection</span>
                        </div>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '800', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '14px' }}>
                            <span style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Saved Properties</span>
                        </h1>
                        <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.7, maxWidth: '560px' }}>
                            Quick access to properties you've bookmarked. Click on any card to view full details.
                        </p>
                    </motion.div>

                    {/* Count */}
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '28px', fontWeight: '500' }}>
                        {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{ borderRadius: '24px', overflow: 'hidden', background: 'rgba(13,21,38,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <div className="skeleton" style={{ height: '220px', borderRadius: 0 }} />
                                    <div style={{ padding: '20px 22px' }}>
                                        <div className="skeleton skeleton-title" style={{ width: '75%', marginBottom: '8px' }} />
                                        <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: '14px' }} />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div className="skeleton" style={{ width: '60px', height: '28px', borderRadius: '8px' }} />
                                            <div className="skeleton" style={{ width: '60px', height: '28px', borderRadius: '8px' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : properties.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 40px', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.07)' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔖</div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>No saved properties yet</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Start exploring and save properties you're interested in.</p>
                            <button className="btn btn-primary" onClick={() => navigate('/buyer')}>
                                🏡 Browse Properties
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                            {properties.map((p, i) => (
                                <motion.div
                                    key={p._id}
                                    initial={{ opacity: 0, y: 28 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => navigate(`/buyer?propertyId=${p._id}`)}
                                    style={{
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        background: 'rgba(13,21,38,0.85)',
                                        backdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        transition: 'all 0.3s',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-8px)';
                                        e.currentTarget.style.boxShadow = '0 28px 64px rgba(0,0,0,0.55)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {/* Unsave Button */}
                                    <button
                                        onClick={(e) => handleUnsave(p._id, e)}
                                        style={{
                                            position: 'absolute',
                                            top: '14px',
                                            right: '14px',
                                            zIndex: 10,
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: 'rgba(245,158,11,0.9)',
                                            border: '1px solid rgba(245,158,11,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239,68,68,0.9)';
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(245,158,11,0.9)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                        </svg>
                                    </button>

                                    {/* Image */}
                                    <div style={{
                                        height: '220px',
                                        background: p.images && p.images.length > 0 ? `url(${p.images[0]}) center/cover` : `linear-gradient(135deg, hsl(${(i * 60) % 360}, 70%, 10%), hsl(${(i * 60 + 60) % 360}, 60%, 15%))`,
                                        position: 'relative'
                                    }}>
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,8,23,0.95) 0%, rgba(2,8,23,0.2) 55%, transparent 100%)' }} />
                                        <div style={{ position: 'absolute', bottom: '14px', right: '14px', fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                                            {priceAbbr(p.price)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '20px 22px 22px' }}>
                                        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '17px', color: 'white', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.title}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '13px', marginBottom: '14px' }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            {p.location || p.city || '—'}
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {p.bedrooms && <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '12px', color: '#93c5fd', fontWeight: '600' }}>🛏 {p.bedrooms}</span>}
                                            {p.area && <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '12px', color: '#fcd34d', fontWeight: '600' }}>📐 {p.area}</span>}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SavedProperties;
