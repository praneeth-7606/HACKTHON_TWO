import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const LeadDashboard = () => {
    const [leads, setLeads] = useState({ HOT: [], WARM: [], COLD: [], LOW: [] });
    const [counts, setCounts] = useState({ total: 0, hot: 0, warm: 0, cold: 0, low: 0 });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferringLead, setTransferringLead] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedTeamMember, setSelectedTeamMember] = useState('');
    const [transferring, setTransferring] = useState(false);
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/users/me').then(r => setUser(r.data.data.user)).catch(() => { });
        fetchLeads();
        fetchTeamMembers();
        const interval = setInterval(fetchLeads, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await api.get('/leads/seller/leads?excludeTransferred=true');
            setLeads(res.data.data.grouped);
            setCounts(res.data.data.counts);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchTeamMembers = async () => {
        try { const res = await api.get('/team-members'); setTeamMembers(res.data.data.teamMembers || []); } catch (err) { }
    };

    const handleTransferLead = async () => {
        if (!selectedTeamMember) return alert('Please select a team member');
        setTransferring(true);
        try {
            await api.post('/team-members/transfer', { leadId: transferringLead._id, toTeamMemberId: selectedTeamMember });
            setShowTransferModal(false); setTransferringLead(null); setSelectedTeamMember(''); fetchLeads();
            alert('Lead transferred successfully!');
        } catch (err) { alert(err.response?.data?.message || 'Failed'); } finally { setTransferring(false); }
    };

    const markAsResponded = async (leadId) => {
        try { await api.patch(`/leads/lead/${leadId}/respond`); fetchLeads(); } catch (err) { alert('Failed'); }
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

    const tierMeta = {
        HOT: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5', icon: '🔥', sla: '15 min', headerBg: 'rgba(239,68,68,0.06)', headerBorder: 'rgba(239,68,68,0.2)' },
        WARM: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', icon: '⚡', sla: '1 hour', headerBg: 'rgba(245,158,11,0.06)', headerBorder: 'rgba(245,158,11,0.2)' },
        COLD: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', icon: '💙', sla: '4 hours', headerBg: 'rgba(59,130,246,0.06)', headerBorder: 'rgba(59,130,246,0.2)' },
        LOW: { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', text: '#94a3b8', icon: '🌫️', sla: '24 hours', headerBg: 'rgba(148,163,184,0.04)', headerBorder: 'rgba(148,163,184,0.15)' },
    };

    // ─── KANBAN LEAD CARD ───
    const KanbanLeadCard = ({ lead, tier }) => {
        const sla = getSLAStatus(lead);
        const c = tierMeta[tier];
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                onClick={() => setSelectedLead(lead)}
                style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '8px' }}
            >
                {/* Score + SLA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '8px', background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: '11px', fontWeight: '800' }}>
                        {lead.scores.total} pts
                    </span>
                    {sla && <span className={`sla-countdown ${sla.cls}`}>{sla.text}</span>}
                </div>

                {/* Name */}
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{lead.buyer?.name || 'Anonymous'}</div>

                {/* Property */}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    🏡 {lead.property?.title}
                </div>

                {/* Engagement indicators */}
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <span>👁 {lead.tracking.viewCount}</span>
                    <span>⏱ {Math.floor(lead.tracking.pageViewTime / 60)}m</span>
                    {lead.tracking.messageSent && <span>✉️</span>}
                    {lead.tracking.saved && <span>💾</span>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                    {!lead.sla?.responded && (
                        <button onClick={e => { e.stopPropagation(); markAsResponded(lead._id); }} style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                            ✓ Respond
                        </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); navigate(`/messages?property=${lead.property._id}&buyer=${lead.buyer._id}`); }} style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        💬 Chat
                    </button>
                    {teamMembers.length > 0 && !lead.sla?.responded && (
                        <button onClick={e => { e.stopPropagation(); setTransferringLead(lead); setShowTransferModal(true); }} style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#d8b4fe', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                            👤
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="bg-dashboard">
            <div className="grid-pattern" />
            <Navbar user={user} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div initial={{ x: -260, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -260, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="sidebar" style={{ top: '64px' }}>
                        {[
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>, label: 'My Listings', action: () => navigate('/seller-dashboard') },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'AI Lead Inbox', active: true, action: () => { } },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, label: 'Messages', action: () => navigate('/messages') },
                            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.64-6.36l-1.42 1.42M6.34 17.66l-1.42 1.42m12.73 0l-1.41-1.42M6.34 6.34L4.93 4.93" /></svg>, label: 'Profile', action: () => navigate('/profile') },
                        ].map(item => (
                            <button key={item.label} className={`sidebar-item ${item.active ? 'active' : ''}`} onClick={item.action}>{item.icon}{item.label}</button>
                        ))}
                        <div style={{ flex: 1 }} />
                        <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6ee7b7' }}>AI Scoring Active</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>Real-time lead prioritization powered by Mistral AI</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="main-content">
                <div className="page-inner">
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <motion.button whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/seller')}
                                style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, marginTop: '4px' }}>←</motion.button>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-blue)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>AI Lead Management</div>
                                <h1 className="heading-xl gradient-text" style={{ marginBottom: '8px' }}>Lead Inbox</h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Prioritized buyer leads scored by AI based on engagement and intent.</p>
                            </div>
                        </div>
                        {/* View toggle */}
                        <div className="tab-bar" style={{ display: 'inline-flex' }}>
                            <button className={`tab-item ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>📋 Kanban</button>
                            <button className={`tab-item ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>📄 List</button>
                        </div>
                    </div>

                    {/* ═══════════ STATS ROW ═══════════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                        {[
                            { icon: '🔥', label: 'HOT', value: counts.hot, color: '#ef4444', sla: '15 min' },
                            { icon: '⚡', label: 'WARM', value: counts.warm, color: '#f59e0b', sla: '1 hour' },
                            { icon: '💙', label: 'COLD', value: counts.cold, color: '#3b82f6', sla: '4 hours' },
                            { icon: '🌫️', label: 'LOW', value: counts.low, color: '#94a3b8', sla: '24 hours' },
                        ].map(s => (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Space Grotesk', color: 'white' }}>{s.value}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.icon} {s.label}</div>
                                    </div>
                                    <div style={{ padding: '4px 10px', borderRadius: '8px', background: `${s.color}15`, fontSize: '11px', fontWeight: '700', color: s.color }}>
                                        SLA: {s.sla}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ═══════════ KANBAN / LIST VIEW ═══════════ */}
                    {loading ? (
                        <div className="kanban-board">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="kanban-column" style={{ height: '400px' }}>
                                    <div className="skeleton skeleton-title" style={{ margin: '16px', width: '100px' }} />
                                    {[1, 2].map(j => <div key={j} className="skeleton" style={{ margin: '8px 12px', height: '120px', borderRadius: '14px' }} />)}
                                </div>
                            ))}
                        </div>
                    ) : counts.total === 0 ? (
                        <div className="empty-state" style={{ border: '2px dashed rgba(255,255,255,0.07)', borderRadius: '24px' }}>
                            <div className="empty-state-icon">📭</div>
                            <h3>No leads yet</h3>
                            <p>When buyers interact with your properties, they'll appear here with AI-calculated priority scores.</p>
                        </div>
                    ) : viewMode === 'kanban' ? (
                        /* ─── KANBAN VIEW ─── */
                        <div className="kanban-board">
                            {['HOT', 'WARM', 'COLD', 'LOW'].map(tier => {
                                const meta = tierMeta[tier];
                                const tierLeads = leads[tier] || [];
                                return (
                                    <div key={tier} className="kanban-column" style={{ borderColor: meta.headerBorder }}>
                                        <div className="kanban-column-header" style={{ background: meta.headerBg, borderBottomColor: meta.headerBorder }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                                                <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '14px', color: 'white' }}>{tier}</span>
                                                <span style={{ padding: '2px 8px', borderRadius: '999px', background: meta.bg, color: meta.text, fontSize: '12px', fontWeight: '800' }}>
                                                    {tierLeads.length}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '11px', color: meta.text, fontWeight: '600' }}>SLA: {meta.sla}</span>
                                        </div>
                                        <div className="kanban-column-body">
                                            {tierLeads.length > 0 ? tierLeads.map(lead => (
                                                <KanbanLeadCard key={lead._id} lead={lead} tier={tier} />
                                            )) : (
                                                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                                    No {tier.toLowerCase()} leads
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ─── LIST VIEW ─── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {['HOT', 'WARM', 'COLD', 'LOW'].map(tier => (leads[tier] || []).map(lead => {
                                const c = tierMeta[tier];
                                const sla = getSLAStatus(lead);
                                return (
                                    <motion.div key={lead._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}
                                        onClick={() => setSelectedLead(lead)}
                                        style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        {/* Thumbnail */}
                                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: lead.property?.images?.[0] ? `url(${lead.property.images[0]}) center/cover` : 'linear-gradient(135deg, #1e293b, #334155)', flexShrink: 0 }} />
                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{lead.buyer?.name || 'Anonymous'}</span>
                                                <span style={{ padding: '2px 8px', borderRadius: '6px', background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: '10px', fontWeight: '800' }}>
                                                    {c.icon} {tier} • {lead.scores.total}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                🏡 {lead.property?.title} • {priceAbbr(lead.property?.price)}
                                            </div>
                                        </div>
                                        {/* SLA */}
                                        {sla && <span className={`sla-countdown ${sla.cls}`}>{sla.text}</span>}
                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {!lead.sla?.responded && <button onClick={e => { e.stopPropagation(); markAsResponded(lead._id); }} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>✓</button>}
                                            <button onClick={e => { e.stopPropagation(); navigate(`/messages?property=${lead.property._id}&buyer=${lead.buyer._id}`); }} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>💬</button>
                                        </div>
                                    </motion.div>
                                );
                            }))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════ LEAD DETAIL SLIDE-OUT ═══════════ */}
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
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Buyer</div>
                                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>{selectedLead.buyer?.name}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                                            📧 {selectedLead.buyer?.email}<br />
                                            📱 {selectedLead.buyer?.phone || 'N/A'}<br />
                                            {selectedLead.buyer?.profession && <>💼 {selectedLead.buyer.profession}</>}
                                        </div>
                                    </div>
                                </div>

                                {/* Property */}
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Property</div>
                                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>{selectedLead.property?.title}</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#3b82f6', fontFamily: 'Space Grotesk', marginBottom: '8px' }}>{priceAbbr(selectedLead.property?.price)}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {selectedLead.property?.bedrooms && `🛏 ${selectedLead.property.bedrooms}BHK • `}
                                            {selectedLead.property?.area && `📐 ${selectedLead.property.area} sqft`}
                                        </div>
                                    </div>
                                </div>

                                {/* Score Breakdown */}
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Score Breakdown</div>
                                    <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'Space Grotesk', color: 'white', marginBottom: '20px', textAlign: 'center' }}>
                                            {selectedLead.scores.total}<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}> / 100</span>
                                        </div>
                                        {[
                                            { label: 'Profile Quality', value: selectedLead.scores.profile, max: 15, color: '#3b82f6' },
                                            { label: 'Property Exploration', value: selectedLead.scores.exploration, max: 25, color: '#8b5cf6' },
                                            { label: 'Engagement', value: selectedLead.scores.engagement, max: 20, color: '#10b981' },
                                            { label: 'AI Interaction', value: selectedLead.scores.aiInteraction, max: 15, color: '#f59e0b' },
                                            { label: 'Owner Contact', value: selectedLead.scores.ownerContact, max: 25, color: '#ef4444' },
                                            { label: 'Bonus Points', value: selectedLead.scores.bonus, max: 10, color: '#06b6d4' },
                                        ].map(item => (
                                            <div key={item.label} style={{ marginBottom: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: item.color }}>{item.value}/{item.max}</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div className="progress-bar-fill" style={{ width: `${(item.value / item.max) * 100}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}88)` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Activity */}
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Activity</div>
                                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Views:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking.viewCount}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Time:</span> <span style={{ color: 'white', fontWeight: '600' }}>{Math.floor(selectedLead.tracking.pageViewTime / 60)}m</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Scroll:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking.scrollDepth}%</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Q&A Read:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking.qaAnswersRead}/{selectedLead.tracking.qaTotalAnswers}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>AI Qs:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking.aiQuestionsAsked}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>First:</span> <span style={{ color: 'white', fontWeight: '600' }}>{formatTime(selectedLead.tracking.firstViewedAt)}</span></div>
                                    </div>
                                </div>

                                {/* Dynamic SLA */}
                                {selectedLead.sla?.calculationDetails && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Dynamic SLA</div>
                                        <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', fontSize: '13px', lineHeight: 1.8 }}>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Base SLA:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.sla.calculationDetails.baseSLA}m</span></div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Queue:</span> <span style={{ color: '#60a5fa', fontWeight: '600' }}>{selectedLead.sla.calculationDetails.queueSize}</span> (×{selectedLead.sla.calculationDetails.queueMultiplier})</div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Pending:</span> <span style={{ color: '#f59e0b', fontWeight: '600' }}>{selectedLead.sla.calculationDetails.activeLeads}</span> (×{selectedLead.sla.calculationDetails.activeMultiplier})</div>
                                            <div className="divider" style={{ margin: '10px 0' }} />
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Final:</span>{' '}
                                                <span style={{ color: '#10b981', fontWeight: '800', fontSize: '16px' }}>{selectedLead.sla.expectedResponseTime}m</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}> ({Math.floor(selectedLead.sla.expectedResponseTime / 60)}h {selectedLead.sla.expectedResponseTime % 60}m)</span>
                                            </div>
                                            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>💡 SLA adjusted based on your current workload</div>
                                        </div>
                                    </div>
                                )}

                                <button onClick={() => setSelectedLead(null)} className="btn btn-secondary" style={{ width: '100%' }}>Close</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══════════ TRANSFER MODAL ═══════════ */}
            <AnimatePresence>
                {showTransferModal && transferringLead && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 300 }} onClick={() => { setShowTransferModal(false); setTransferringLead(null); setSelectedTeamMember(''); }} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 301, width: 'min(480px, 90vw)', padding: '32px', borderRadius: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Transfer Lead</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Select a team member to handle this lead</p>

                            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{transferringLead.buyer?.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{transferringLead.property?.title}</div>
                            </div>

                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Team Members</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                {teamMembers.map(m => (
                                    <button key={m.userId} onClick={() => setSelectedTeamMember(m.userId)}
                                        style={{ padding: '14px', background: selectedTeamMember === m.userId ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)', border: selectedTeamMember === m.userId ? '2px solid rgba(59,130,246,0.5)' : '1px solid var(--border)', borderRadius: '12px', color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <div style={{ fontWeight: '600', marginBottom: '2px' }}>{m.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.email} • {m.role}</div>
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => { setShowTransferModal(false); setTransferringLead(null); setSelectedTeamMember(''); }} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button onClick={handleTransferLead} disabled={!selectedTeamMember || transferring} className="btn btn-primary" style={{ flex: 1, opacity: !selectedTeamMember || transferring ? 0.5 : 1 }}>
                                    {transferring ? 'Transferring...' : 'Transfer Lead'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeadDashboard;
