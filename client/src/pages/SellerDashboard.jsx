import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../services/api';

const SellerDashboard = () => {
    const [properties, setProperties] = useState([]);
    const [user, setUser] = useState(null);
    const [generatingQA, setGeneratingQA] = useState({});
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [deletingProperty, setDeletingProperty] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/users/me').then(r => setUser(r.data.data.user)).catch(() => { });
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const r = await api.get('/properties/seller/my-properties');
            setProperties(r.data.data.properties || []);
        } catch (e) { } finally { setLoading(false); }
    };

    const generateQAForProperty = async (propertyId) => {
        setGeneratingQA(prev => ({ ...prev, [propertyId]: true }));
        try {
            await api.post(`/qa/generate/${propertyId}`);
            await fetchProperties();
            alert('✅ Questions generated successfully! Click Edit to answer them.');
        } catch (err) {
            alert('Failed to generate questions. Please try again.');
        } finally {
            setGeneratingQA(prev => ({ ...prev, [propertyId]: false }));
        }
    };

    const deleteProperty = async (propertyId, propertyTitle) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${propertyTitle}"?\n\nThis action cannot be undone and will remove the property from the system permanently.`
        );
        
        if (!confirmed) return;
        
        setDeletingProperty(prev => ({ ...prev, [propertyId]: true }));
        
        // Show loading toast
        const loadingToast = toast.loading('Deleting property...');
        
        try {
            await api.delete(`/properties/${propertyId}`);
            await fetchProperties();
            
            // Success toast
            toast.success('Property deleted successfully!', {
                id: loadingToast,
                duration: 4000,
                icon: '🗑️',
            });
        } catch (err) {
            // Error toast
            toast.error(err.response?.data?.message || 'Failed to delete property. Please try again.', {
                id: loadingToast,
                duration: 5000,
            });
            console.error('Delete error:', err);
        } finally {
            setDeletingProperty(prev => ({ ...prev, [propertyId]: false }));
        }
    };

    const priceAbbr = (n) => {
        if (!n) return '—';
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
        if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
        return `₹${n}`;
    };

    // Seller performance data
    const rating = user?.sellerRating || {};
    const score = rating.score ?? 100;
    const tier = rating.tier || 'excellent';
    const tierConfig = {
        elite: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '🏆 Elite' },
        excellent: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '⭐ Excellent' },
        good: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: '👍 Good' },
        fair: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '⚠️ Fair' },
        poor: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '⛔ Poor' },
    };
    const tc = tierConfig[tier] || tierConfig.excellent;
    const circumference = 2 * Math.PI * 42;
    const scoreOffset = circumference - (score / 100) * circumference;

    // Count stats
    const activeCount = properties.filter(p => p.listingStatus === 'Active').length;
    const soldCount = properties.filter(p => p.listingStatus === 'Sold').length;
    const rentedCount = properties.filter(p => p.listingStatus === 'Rented').length;

    return (
        <div className="bg-dashboard">
            <div className="grid-pattern" />
            <Navbar user={user} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

            {/* SIDEBAR */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div initial={{ x: -260, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -260, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="sidebar" style={{ top: '64px' }}>
                        {[
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>, label: 'My Listings', active: true, action: () => { } },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'AI Lead Inbox', action: () => navigate('/leads') },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, label: 'Messages', action: () => navigate('/messages') },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, label: 'Team', action: () => navigate('/team-member-dashboard') },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.64-6.36l-1.42 1.42M6.34 17.66l-1.42 1.42m12.73 0l-1.41-1.42M6.34 6.34L4.93 4.93" /></svg>, label: 'Profile', action: () => navigate('/profile') },
                        ].map(item => (
                            <button key={item.label} className={`sidebar-item ${item.active ? 'active' : ''}`} onClick={item.action}>
                                {item.icon}{item.label}
                            </button>
                        ))}
                        <div style={{ flex: 1 }} />
                        <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6ee7b7' }}>Mistral AI Active</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>Scoring leads in real-time</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="main-content">
                <div className="page-inner">

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <motion.button whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/')}
                                style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, marginTop: '4px' }}>←</motion.button>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-blue)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Seller Console</div>
                                <h1 className="heading-xl gradient-text" style={{ marginBottom: '8px' }}>My Properties</h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Manage listings, track leads, and monitor your performance.</p>
                            </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary btn-lg" onClick={() => navigate('/list-property')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Post New Listing
                        </motion.button>
                    </div>

                    {/* ═══════════ PERFORMANCE SCORECARD + STATS ═══════════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', marginBottom: '32px' }}>
                        {/* Seller Rating Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: '28px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Seller Rating</div>

                            {/* Score Ring */}
                            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                    <motion.circle
                                        cx="60" cy="60" r="42" fill="none"
                                        stroke={tc.color} strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        initial={{ strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset: scoreOffset }}
                                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '32px', fontWeight: '900', color: 'white', fontFamily: 'Space Grotesk' }}>{score}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/100</span>
                                </div>
                            </div>

                            {/* Tier Badge */}
                            <div style={{ padding: '6px 16px', borderRadius: '999px', background: tc.bg, border: `1px solid ${tc.color}40`, fontSize: '13px', fontWeight: '700', color: tc.color }}>
                                {tc.label}
                            </div>

                            {/* Rating breakdown */}
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { label: 'Response Rate', value: rating.responseRate ?? 100, color: '#3b82f6' },
                                    { label: 'SLA Compliance', value: rating.slaCompliance ?? 100, color: '#10b981' },
                                    { label: 'Buyer Satisfaction', value: rating.buyerSatisfaction ?? 100, color: '#8b5cf6' },
                                ].map(m => (
                                    <div key={m.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.label}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: m.color }}>{m.value}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <motion.div
                                                className="progress-bar-fill"
                                                initial={{ width: '0%' }}
                                                animate={{ width: `${m.value}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                style={{ background: `linear-gradient(90deg, ${m.color}, ${m.color}88)` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { icon: '🏡', label: 'Total Listings', value: properties.length, color: '#3b82f6', sub: `${activeCount} active` },
                                { icon: '🔥', label: 'SLA Breaches', value: rating.slaBreaches ?? 0, color: '#ef4444', sub: `${rating.consecutiveBreaches ?? 0} consecutive` },
                                { icon: '✅', label: 'Sold / Rented', value: soldCount + rentedCount, color: '#10b981', sub: `${soldCount} sold, ${rentedCount} rented` },
                                { icon: '📊', label: 'Total Leads', value: rating.totalLeads ?? 0, color: '#8b5cf6', sub: `${rating.respondedLeads ?? 0} responded` },
                            ].map((s, i) => (
                                <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="glass" style={{ padding: '24px', borderRadius: '18px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '24px' }}>{s.icon}</span>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Space Grotesk', color: 'white', marginBottom: '4px' }}>{s.value}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.sub}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* ═══════════ QUICK ACTIONS BAR ═══════════ */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {[
                            { label: '📊 Lead Inbox', action: () => navigate('/leads'), accent: '#3b82f6' },
                            { label: '💬 Messages', action: () => navigate('/messages'), accent: '#10b981' },
                            { label: '👥 Team Members', action: () => navigate('/team-member-dashboard'), accent: '#8b5cf6' },
                            { label: '🤖 AI Chat', action: () => navigate('/agent-chat'), accent: '#f59e0b' },
                        ].map(a => (
                            <motion.button key={a.label} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={a.action} style={{ padding: '12px 20px', borderRadius: '12px', background: `${a.accent}12`, border: `1px solid ${a.accent}30`, color: a.accent, fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {a.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* ═══════════ PROPERTIES GRID ═══════════ */}
                    {loading ? (
                        <div className="grid-3">
                            {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '340px' }} />)}
                        </div>
                    ) : (
                        <div className="grid-3">
                            {properties.map((p, i) => (
                                <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="glass card" style={{ padding: '0' }}>
                                    <div style={{
                                        height: '180px', borderRadius: '20px 20px 0 0',
                                        background: p.images && p.images.length > 0 ? `url(${p.images[0]}) center/cover` : `linear-gradient(135deg, hsl(${(i * 60) % 360}, 70%, 10%), hsl(${(i * 60 + 60) % 360}, 60%, 15%))`,
                                        position: 'relative', overflow: 'hidden',
                                    }}>
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(5,15,35,0.3), rgba(5,15,35,0.7))', zIndex: 1 }} />

                                        {/* Status badge */}
                                        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 3 }}>
                                            <span className={`badge ${p.approvalStatus === 'pending' ? 'badge-medium' : p.approvalStatus === 'rejected' ? 'badge-high' : 'badge-low'}`}>
                                                {p.approvalStatus === 'pending' ? '⏳ Pending' : p.approvalStatus === 'rejected' ? '❌ Rejected' : '✅ Approved'}
                                            </span>
                                        </div>

                                        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 3 }} className="badge badge-new">{p.listingType || 'Sale'}</div>
                                        <div style={{ position: 'absolute', bottom: '14px', right: '14px', zIndex: 3, fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '20px', color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{priceAbbr(p.price)}</div>
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: 'white', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
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

                                        {/* Q&A Progress */}
                                        {p.sellerQA && p.sellerQA.length > 0 && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Q&A Progress</span>
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981' }}>{p.sellerQA.filter(q => q.answer).length}/{p.sellerQA.length}</span>
                                                </div>
                                                <div className="progress-bar" style={{ height: '4px' }}>
                                                    <div className="progress-bar-fill success" style={{ width: `${(p.sellerQA.filter(q => q.answer).length / p.sellerQA.length) * 100}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Engagement Stats */}
                                        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            <span>👁 {p.visitCount || 0} views</span>
                                            <span>❤️ {p.likes?.length || 0} likes</span>
                                            <span>💬 {p.comments?.length || 0}</span>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => navigate(`/list-property?edit=${p._id}`)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                ✏️ Edit
                                            </motion.button>

                                            <select value={p.listingStatus || 'Active'} onChange={async (e) => { try { await api.patch(`/properties/${p._id}`, { listingStatus: e.target.value }); fetchProperties(); } catch (err) { alert('Failed'); } }}
                                                style={{
                                                    flex: 1, padding: '10px', borderRadius: '10px',
                                                    background: p.listingStatus === 'Sold' ? 'rgba(239,68,68,0.1)' : p.listingStatus === 'Rented' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                                    border: `1px solid ${p.listingStatus === 'Sold' ? 'rgba(239,68,68,0.3)' : p.listingStatus === 'Rented' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                                                    color: p.listingStatus === 'Sold' ? '#fca5a5' : p.listingStatus === 'Rented' ? '#fbbf24' : '#6ee7b7',
                                                    fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none',
                                                }}>
                                                <option value="Active" style={{ background: '#0d1526' }}>🟢 Active</option>
                                                <option value="Sold" style={{ background: '#0d1526' }}>🔴 Sold</option>
                                                <option value="Rented" style={{ background: '#0d1526' }}>🟡 Rented</option>
                                            </select>
                                        </div>

                                        {/* Delete Button */}
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }} 
                                            whileTap={{ scale: 0.97 }} 
                                            onClick={() => deleteProperty(p._id, p.title)} 
                                            disabled={deletingProperty[p._id]}
                                            style={{ 
                                                width: '100%', 
                                                padding: '10px', 
                                                borderRadius: '10px', 
                                                background: 'rgba(239,68,68,0.1)', 
                                                border: '1px solid rgba(239,68,68,0.25)', 
                                                color: '#f87171', 
                                                fontSize: '13px', 
                                                fontWeight: '600', 
                                                cursor: deletingProperty[p._id] ? 'not-allowed' : 'pointer', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                gap: '6px',
                                                opacity: deletingProperty[p._id] ? 0.6 : 1
                                            }}>
                                            {deletingProperty[p._id] ? (
                                                <>
                                                    <div className="loader" style={{ width: '14px', height: '14px', borderColor: '#f87171', borderTopColor: 'transparent' }} />
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>🗑️ Delete Property</>
                                            )}
                                        </motion.button>

                                        {(!p.sellerQA || p.sellerQA.length === 0) && (
                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => generateQAForProperty(p._id)} disabled={generatingQA[p._id]}
                                                style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', fontSize: '13px', fontWeight: '600', cursor: generatingQA[p._id] ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: generatingQA[p._id] ? 0.6 : 1 }}>
                                                {generatingQA[p._id] ? <><div className="loader" style={{ width: '14px', height: '14px' }} /> Generating...</> : <>🤖 Generate Q&A</>}
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Empty State */}
                            {!loading && properties.length === 0 && (
                                <div className="empty-state" style={{ gridColumn: '1 / -1', border: '2px dashed rgba(255,255,255,0.07)', borderRadius: '24px' }}>
                                    <div className="empty-state-icon">🏡</div>
                                    <h3>No listings yet</h3>
                                    <p>Post your first property using our 3-way AI listing system.</p>
                                    <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/list-property')}>
                                        🚀 Post Your First Listing
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
