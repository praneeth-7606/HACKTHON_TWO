import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const TeamMemberDashboard = () => {
    const [leads, setLeads] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/users/me').then(r => setUser(r.data.data.user)).catch(() => navigate('/auth'));
        fetchAssignedLeads();
        const interval = setInterval(fetchAssignedLeads, 5000);
        return () => clearInterval(interval);
    }, [navigate]);

    const fetchAssignedLeads = async () => {
        try { const res = await api.get('/team-members/leads/assigned'); setLeads(res.data.data.leads || []); }
        catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const markAsResponded = async (leadId) => {
        try { await api.patch(`/leads/lead/${leadId}/respond`); fetchAssignedLeads(); } catch (err) { alert('Failed'); }
    };
    const markAsComplete = async (leadId) => {
        try { await api.patch(`/leads/lead/${leadId}/complete`); fetchAssignedLeads(); } catch (err) { alert('Failed'); }
    };

    const priceAbbr = (n) => {
        if (!n) return '—';
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
        return `₹${n}`;
    };
    const formatTime = (date) => {
        if (!date) return '—';
        const diff = Date.now() - new Date(date);
        const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
        if (d > 0) return `${d}d ago`;
        if (h > 0) return `${h}h ago`;
        if (m > 0) return `${m}m ago`;
        return 'Just now';
    };
    const getSLAStatus = (lead) => {
        if (!lead.sla?.responseDeadline) return null;
        const diff = new Date(lead.sla.responseDeadline) - Date.now();
        const minutes = Math.floor(diff / 60000);
        if (lead.sla.responded) return { text: '✓ Responded', color: '#10b981', cls: 'safe' };
        if (minutes < 0) return { text: 'SLA Breached!', color: '#ef4444', cls: 'critical' };
        if (minutes < 15) return { text: `${minutes}m left!`, color: '#f59e0b', cls: 'critical' };
        if (minutes < 60) return { text: `${minutes}m left`, color: '#f59e0b', cls: 'warning' };
        return { text: `${Math.floor(minutes / 60)}h left`, color: '#6ee7b7', cls: 'safe' };
    };

    if (!user) return null;

    const pendingCount = leads.filter(l => !l.sla?.responded).length;
    const respondedCount = leads.filter(l => l.sla?.responded).length;
    const completedCount = leads.filter(l => l.status === 'COMPLETED').length;

    return (
        <div className="bg-dashboard">
            <div className="grid-pattern" />
            <Navbar user={user} />

            <div className="sidebar" style={{ top: '64px' }}>
                {[
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'Assigned Leads', active: true, action: () => { } },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, label: 'Messages', action: () => navigate('/messages') },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.64-6.36l-1.42 1.42M6.34 17.66l-1.42 1.42m12.73 0l-1.41-1.42M6.34 6.34L4.93 4.93" /></svg>, label: 'Profile', action: () => navigate('/profile') },
                ].map(item => (
                    <button key={item.label} className={`sidebar-item ${item.active ? 'active' : ''}`} onClick={item.action}>{item.icon}{item.label}</button>
                ))}
                <div style={{ flex: 1 }} />
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#c4b5fd' }}>Team Member Mode</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>Viewing leads assigned to you</div>
                </div>
            </div>

            <div className="main-content">
                <div className="page-inner">
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#a78bfa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Team Member Console</div>
                        <h1 className="heading-xl gradient-text" style={{ marginBottom: '8px' }}>My Assigned Leads</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Leads transferred to you by your seller. Handle inquiries and close deals.</p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                        {[
                            { icon: '📋', label: 'Total', value: leads.length, color: '#3b82f6' },
                            { icon: '⏳', label: 'Pending', value: pendingCount, color: '#f59e0b' },
                            { icon: '✅', label: 'Responded', value: respondedCount, color: '#10b981' },
                            { icon: '🎯', label: 'Completed', value: completedCount, color: '#8b5cf6' },
                        ].map((s, i) => (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="glass" style={{ padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                                <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Space Grotesk', color: 'white' }}>{s.value}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Lead Cards */}
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />)}
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="empty-state" style={{ border: '2px dashed rgba(255,255,255,0.07)', borderRadius: '24px' }}>
                            <div className="empty-state-icon">📭</div>
                            <h3>No assigned leads yet</h3>
                            <p>When your seller transfers leads, they'll appear here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {leads.map((lead, i) => {
                                const sla = getSLAStatus(lead);
                                return (
                                    <motion.div key={lead._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} onClick={() => setSelectedLead(lead)}
                                        style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '18px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        {/* Thumbnail */}
                                        <div style={{ width: '72px', height: '72px', borderRadius: '14px', background: lead.property?.images?.[0] ? `url(${lead.property.images[0]}) center/cover` : 'linear-gradient(135deg, #1e293b, #334155)', flexShrink: 0 }} />
                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{lead.buyer?.name || 'Anonymous'}</span>
                                                <span style={{ padding: '3px 10px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd', fontSize: '10px', fontWeight: '800' }}>ASSIGNED</span>
                                                {sla && <span className={`sla-countdown ${sla.cls}`}>{sla.text}</span>}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                🏡 {lead.property?.title} • {priceAbbr(lead.property?.price)}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                👤 From: <span style={{ color: '#60a5fa', fontWeight: '600' }}>{lead.seller?.name}</span> • 👁 {lead.tracking?.viewCount || 0} views • ⏱ {Math.floor((lead.tracking?.pageViewTime || 0) / 60)}m
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                            {!lead.sla?.responded && (
                                                <button onClick={e => { e.stopPropagation(); markAsResponded(lead._id); }} style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✓ Respond</button>
                                            )}
                                            <button onClick={e => { e.stopPropagation(); navigate(`/messages?contactId=${lead.buyer?._id}&propertyId=${lead.property?._id}`); }} style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>💬</button>
                                            {lead.status !== 'COMPLETED' && (
                                                <button onClick={e => { e.stopPropagation(); markAsComplete(lead._id); }} style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#d8b4fe', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✅</button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-Out Detail Panel */}
            <AnimatePresence>
                {selectedLead && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="slideout-overlay" onClick={() => setSelectedLead(null)} />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="slideout-panel">
                            <div className="slideout-header">
                                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '700', color: 'white' }}>Lead Details</h2>
                                <button onClick={() => setSelectedLead(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>×</button>
                            </div>
                            <div className="slideout-body">
                                {/* Buyer */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Buyer</div>
                                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>{selectedLead.buyer?.name}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                            📧 {selectedLead.buyer?.email}<br />📱 {selectedLead.buyer?.phone || 'N/A'}
                                            {selectedLead.buyer?.profession && <><br />💼 {selectedLead.buyer.profession}</>}
                                        </div>
                                    </div>
                                </div>
                                {/* Property */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Property</div>
                                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>{selectedLead.property?.title}</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#3b82f6', fontFamily: 'Space Grotesk', marginBottom: '6px' }}>{priceAbbr(selectedLead.property?.price)}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {selectedLead.property?.bedrooms && `🛏 ${selectedLead.property.bedrooms}BHK • `}
                                            {selectedLead.property?.area && `📐 ${selectedLead.property.area} sqft`}
                                        </div>
                                    </div>
                                </div>
                                {/* Seller */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Transferred From</div>
                                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{selectedLead.seller?.name}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📧 {selectedLead.seller?.email}</div>
                                    </div>
                                </div>
                                {/* Activity */}
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Activity</div>
                                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Views:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking?.viewCount || 0}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Time:</span> <span style={{ color: 'white', fontWeight: '600' }}>{Math.floor((selectedLead.tracking?.pageViewTime || 0) / 60)}m</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.status}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Assigned:</span> <span style={{ color: 'white', fontWeight: '600' }}>{formatTime(selectedLead.transferredAt)}</span></div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLead(null)} className="btn btn-secondary" style={{ width: '100%' }}>Close</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamMemberDashboard;
