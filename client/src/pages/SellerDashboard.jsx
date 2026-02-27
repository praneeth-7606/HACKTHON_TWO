import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const SellerDashboard = () => {
    const [properties, setProperties] = useState([]);
    const [user, setUser] = useState(null);
    const [generatingQA, setGeneratingQA] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/users/me').then(r => setUser(r.data.data.user)).catch(() => { });
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            // Fetch only seller's own properties
            const r = await api.get('/properties/seller/my-properties');
            setProperties(r.data.data.properties || []);
        } catch (e) { }
    };
    
    const generateQAForProperty = async (propertyId) => {
        setGeneratingQA(prev => ({ ...prev, [propertyId]: true }));
        try {
            await api.post(`/qa/generate/${propertyId}`);
            await fetchProperties(); // Refresh to show Q&A exists
            alert('✅ Questions generated successfully! Click Edit to answer them.');
        } catch (err) {
            alert('Failed to generate questions. Please try again.');
        } finally {
            setGeneratingQA(prev => ({ ...prev, [propertyId]: false }));
        }
    };

    const priceAbbr = (n) => {
        if (!n) return '—';
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
        if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
        return `₹${n}`;
    };

    return (
        <div className="bg-dashboard">
            <div className="grid-pattern" />
            <Navbar user={user} />

            {/* SIDEBAR */}
            <div className="sidebar" style={{ top: '64px' }}>
                {[
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>, label: 'My Listings', active: true, action: () => { } },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'AI Lead Inbox', action: () => navigate('/leads') },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>, label: 'Profile', action: () => navigate('/profile') },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>, label: 'Analytics', action: () => { } },
                ].map(item => (
                    <button key={item.label} className={`sidebar-item ${item.active ? 'active' : ''}`} onClick={item.action}>
                        {item.icon}{item.label}
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#6ee7b7' }}>Gemini AI Active</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>Scoring leads in real-time using Gemini 1.5 Flash</div>
                </div>
            </div>

            <div className="main-content">
                <div className="page-inner">

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-blue)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Seller Console</div>
                            <h1 className="heading-xl gradient-text" style={{ marginBottom: '8px' }}>My Properties</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Manage your listings and track AI-scored buyer leads.</p>
                        </div>
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/list-property')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Post New Listing
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid-3" style={{ marginBottom: '40px' }}>
                        {[
                            { icon: '🏡', label: 'Total Listings', value: properties.length, color: '#3b82f6' },
                            { icon: '🔥', label: 'Hot Leads', value: '—', color: '#ef4444' },
                            { icon: '📈', label: 'Avg Lead Score', value: '—', color: '#10b981' },
                        ].map(s => (
                            <div key={s.label} className="stat-card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '28px' }}>{s.icon}</span>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Space Grotesk', color: 'white' }}>{s.value}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Properties Grid */}
                    <div className="grid-3">
                        {properties.map((p, i) => (
                            <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="glass card" style={{ padding: '0' }}>
                                <div style={{
                                    height: '180px', borderRadius: '20px 20px 0 0',
                                    background: p.images && p.images.length > 0 ? `url(${p.images[0]}) center/cover` : `linear-gradient(135deg, hsl(${(i * 60) % 360}, 70%, 10%), hsl(${(i * 60 + 60) % 360}, 60%, 15%))`,
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(5,15,35,0.4), rgba(5,15,35,0.8))', zIndex: 1 }} />
                                    <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 3 }} className="badge badge-new">{p.listingType || 'Active'}</div>
                                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 3, fontSize: '28px' }}>🏡</div>
                                    <div style={{ position: 'absolute', bottom: '14px', right: '14px', zIndex: 3, fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '18px', color: 'white' }}>{priceAbbr(p.price)}</div>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: 'white', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', flexWrap: 'wrap' }}>
                                        {p.bedrooms && <span>🛏 {p.bedrooms}BHK</span>}
                                        {p.area && <span>📐 {p.area} {p.areaUnit || 'sqft'}</span>}
                                        <span>📍 {p.city || p.location}</span>
                                    </div>
                                    {p.features && p.features.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                            {p.features.slice(0, 3).map(f => (
                                                <span key={f} className="tag" style={{ fontSize: '11px', padding: '2px 8px' }}>{f}</span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                        {/* Row 1: Edit and Status */}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => navigate(`/list-property?edit=${p._id}`)}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    borderRadius: '10px',
                                                    background: 'rgba(59,130,246,0.1)',
                                                    border: '1px solid rgba(59,130,246,0.3)',
                                                    color: '#60a5fa',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                                Edit
                                            </button>
                                            
                                            <select
                                                value={p.listingStatus || 'Active'}
                                                onChange={async (e) => {
                                                    const newStatus = e.target.value;
                                                    try {
                                                        await api.patch(`/properties/${p._id}`, { listingStatus: newStatus });
                                                        fetchProperties(); // Refresh list
                                                    } catch (err) {
                                                        alert('Failed to update status');
                                                    }
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 8px',
                                                    borderRadius: '10px',
                                                    background: p.listingStatus === 'Sold' ? 'rgba(239,68,68,0.1)' : 
                                                               p.listingStatus === 'Rented' ? 'rgba(245,158,11,0.1)' : 
                                                               'rgba(16,185,129,0.1)',
                                                    border: p.listingStatus === 'Sold' ? '1px solid rgba(239,68,68,0.3)' : 
                                                           p.listingStatus === 'Rented' ? '1px solid rgba(245,158,11,0.3)' : 
                                                           '1px solid rgba(16,185,129,0.3)',
                                                    color: p.listingStatus === 'Sold' ? '#fca5a5' : 
                                                          p.listingStatus === 'Rented' ? '#fbbf24' : 
                                                          '#6ee7b7',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="Active" style={{ background: '#0d1526' }}>🟢 Active</option>
                                                <option value="Sold" style={{ background: '#0d1526' }}>🔴 Sold</option>
                                                <option value="Rented" style={{ background: '#0d1526' }}>🟡 Rented</option>
                                            </select>
                                        </div>
                                        
                                        {/* Row 2: Q&A Button (if no Q&A exists) */}
                                        {(!p.sellerQA || p.sellerQA.length === 0) && (
                                            <button
                                                onClick={() => generateQAForProperty(p._id)}
                                                disabled={generatingQA[p._id]}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    borderRadius: '10px',
                                                    background: generatingQA[p._id] ? 'rgba(139,92,246,0.05)' : 'rgba(139,92,246,0.1)',
                                                    border: '1px solid rgba(139,92,246,0.3)',
                                                    color: '#a78bfa',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: generatingQA[p._id] ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s',
                                                    opacity: generatingQA[p._id] ? 0.6 : 1
                                                }}
                                                onMouseEnter={e => {
                                                    if (!generatingQA[p._id]) {
                                                        e.currentTarget.style.background = 'rgba(139,92,246,0.2)';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = generatingQA[p._id] ? 'rgba(139,92,246,0.05)' : 'rgba(139,92,246,0.1)';
                                                }}
                                            >
                                                {generatingQA[p._id] ? (
                                                    <>
                                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', animation: 'spin 0.6s linear infinite' }} />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                        </svg>
                                                        Generate Q&A
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        
                                        {/* Q&A Status Badge */}
                                        {p.sellerQA && p.sellerQA.length > 0 && (
                                            <div style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                background: 'rgba(16,185,129,0.1)',
                                                border: '1px solid rgba(16,185,129,0.2)',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                color: '#6ee7b7',
                                                textAlign: 'center'
                                            }}>
                                                ✓ {p.sellerQA.filter(q => q.answer).length}/{p.sellerQA.length} Q&A Answered
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Empty State */}
                        {properties.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 40px', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.07)' }}>
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏡</div>
                                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>No listings yet</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Post your first property using our 3-way AI listing system.</p>
                                <button className="btn btn-primary" onClick={() => navigate('/list-property')}>
                                    🚀 Post Your First Listing
                                </button>
                            </div>
                        )}
                    </div>
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

export default SellerDashboard;
