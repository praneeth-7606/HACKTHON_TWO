import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    const [selectedTeamMember, setSelectedTeamMember] = useState('');
    const [transferring, setTransferring] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/users/me').then(r => setUser(r.data.data.user)).catch(() => {});
        fetchLeads();
        fetchTeamMembers();
        
        // Poll for new leads every 5 seconds
        const interval = setInterval(fetchLeads, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            // Fetch only leads NOT transferred to team members
            const res = await api.get('/leads/seller/leads?excludeTransferred=true');
            setLeads(res.data.data.grouped);
            setCounts(res.data.data.counts);
        } catch (err) {
            console.error('Failed to fetch leads:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const res = await api.get('/team-members');
            setTeamMembers(res.data.data.teamMembers || []);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
        }
    };

    const handleTransferLead = async () => {
        if (!selectedTeamMember) {
            alert('Please select a team member');
            return;
        }

        setTransferring(true);
        try {
            await api.post('/team-members/transfer', {
                leadId: transferringLead._id,
                toTeamMemberId: selectedTeamMember
            });
            setShowTransferModal(false);
            setTransferringLead(null);
            setSelectedTeamMember('');
            fetchLeads();
            alert('Lead transferred successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to transfer lead');
        } finally {
            setTransferring(false);
        }
    };

    const markAsResponded = async (leadId) => {
        try {
            await api.patch(`/leads/lead/${leadId}/respond`);
            fetchLeads(); // Refresh
        } catch (err) {
            alert('Failed to mark as responded');
        }
    };

    const priceAbbr = (n) => {
        if (!n) return '—';
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
        return `₹${n}`;
    };

    const formatTime = (date) => {
        if (!date) return '—';
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const getSLAStatus = (lead) => {
        if (!lead.sla.responseDeadline) return null;
        const deadline = new Date(lead.sla.responseDeadline);
        const now = new Date();
        const diff = deadline - now;
        const minutes = Math.floor(diff / 60000);
        
        if (lead.sla.responded) return { text: 'Responded', color: '#10b981', urgent: false };
        if (minutes < 0) return { text: 'SLA Breached!', color: '#ef4444', urgent: true };
        if (minutes < 15) return { text: `${minutes}m left!`, color: '#f59e0b', urgent: true };
        if (minutes < 60) return { text: `${minutes}m left`, color: '#f59e0b', urgent: false };
        const hours = Math.floor(minutes / 60);
        return { text: `${hours}h left`, color: '#6ee7b7', urgent: false };
    };

    const LeadCard = ({ lead, tier }) => {
        const slaStatus = getSLAStatus(lead);
        const tierColors = {
            HOT: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5', icon: '🔥' },
            WARM: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', icon: '⚡' },
            COLD: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', icon: '💙' },
            LOW: { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', text: '#94a3b8', icon: '🌫️' }
        };
        const colors = tierColors[tier];

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass card"
                style={{ padding: '20px', marginBottom: '12px', cursor: 'pointer' }}
                onClick={() => setSelectedLead(lead)}
            >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    {/* Property Image */}
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '12px',
                        background: lead.property?.images?.[0] ? `url(${lead.property.images[0]}) center/cover` : 'linear-gradient(135deg, #1e293b, #334155)',
                        flexShrink: 0
                    }} />
                    
                    {/* Lead Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '20px' }}>{colors.icon}</span>
                            <span style={{
                                padding: '4px 10px', borderRadius: '6px',
                                background: colors.bg, border: `1px solid ${colors.border}`,
                                color: colors.text, fontSize: '11px', fontWeight: '700'
                            }}>
                                {tier} • {lead.scores.total} pts
                            </span>
                            {slaStatus && (
                                <span style={{
                                    padding: '4px 10px', borderRadius: '6px',
                                    background: slaStatus.urgent ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                    border: `1px solid ${slaStatus.urgent ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                                    color: slaStatus.color, fontSize: '11px', fontWeight: '600'
                                }}>
                                    {slaStatus.urgent && '⚠️ '}{slaStatus.text}
                                </span>
                            )}
                        </div>
                        
                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                            {lead.buyer?.name || 'Anonymous'}
                        </h3>
                        
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            📧 {lead.buyer?.email} • 📱 {lead.buyer?.phone || 'N/A'}
                        </div>
                        
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            🏡 {lead.property?.title} • {priceAbbr(lead.property?.price)}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>👁️ {lead.tracking.viewCount} views</span>
                            <span>⏱️ {Math.floor(lead.tracking.pageViewTime / 60)}m spent</span>
                            {lead.tracking.messageSent && <span>✉️ Messaged</span>}
                            {lead.tracking.saved && <span>💾 Saved</span>}
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {!lead.sla.responded && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAsResponded(lead._id);
                                }}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px',
                                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                                    color: '#6ee7b7', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                ✓ Mark Responded
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/messages?property=${lead.property._id}&buyer=${lead.buyer._id}`);
                            }}
                            style={{
                                padding: '8px 16px', borderRadius: '8px',
                                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                                color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            💬 Message
                        </button>
                        {teamMembers.length > 0 && !lead.sla.responded && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setTransferringLead(lead);
                                    setShowTransferModal(true);
                                }}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px',
                                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                                    color: '#d8b4fe', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                👤 Transfer
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="bg-dashboard">
            <div className="grid-pattern" />
            <Navbar user={user} />

            {/* SIDEBAR */}
            <div className="sidebar" style={{ top: '64px' }}>
                {[
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>, label: 'My Listings', action: () => navigate('/seller-dashboard') },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'AI Lead Inbox', active: true, action: () => {} },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>, label: 'Profile', action: () => navigate('/profile') },
                ].map(item => (
                    <button key={item.label} className={`sidebar-item ${item.active ? 'active' : ''}`} onClick={item.action}>
                        {item.icon}{item.label}
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#6ee7b7' }}>AI Scoring Active</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>Real-time lead prioritization powered by Gemini</div>
                </div>
            </div>

            <div className="main-content">
                <div className="page-inner">
                    {/* Header */}
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-blue)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>AI Lead Management</div>
                        <h1 className="heading-xl gradient-text" style={{ marginBottom: '8px' }}>Lead Inbox</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Prioritized buyer leads scored by AI based on engagement and intent.</p>
                    </div>

                    {/* Stats */}
                    <div className="grid-4" style={{ marginBottom: '40px' }}>
                        {[
                            { icon: '🔥', label: 'HOT Leads', value: counts.hot, color: '#ef4444', sla: '15 min' },
                            { icon: '⚡', label: 'WARM Leads', value: counts.warm, color: '#f59e0b', sla: '1 hour' },
                            { icon: '💙', label: 'COLD Leads', value: counts.cold, color: '#3b82f6', sla: '4 hours' },
                            { icon: '🌫️', label: 'LOW Leads', value: counts.low, color: '#94a3b8', sla: '24 hours' },
                        ].map(s => (
                            <div key={s.label} className="stat-card">
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{s.icon}</div>
                                <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Space Grotesk', color: 'white' }}>{s.value}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
                                <div style={{ fontSize: '11px', color: s.color, marginTop: '4px', fontWeight: '600' }}>SLA: {s.sla}</div>
                            </div>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <div style={{ width: '40px', height: '40px', margin: '0 auto 16px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            Loading leads...
                        </div>
                    ) : counts.total === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 40px', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.07)' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>No leads yet</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>When buyers interact with your properties, they'll appear here with AI-calculated priority scores.</p>
                        </div>
                    ) : (
                        <>
                            {/* HOT LEADS */}
                            {leads.HOT.length > 0 && (
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <span style={{ fontSize: '28px' }}>🔥</span>
                                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '700', color: 'white' }}>
                                            HOT Leads ({leads.HOT.length})
                                        </h2>
                                        <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '12px', fontWeight: '600' }}>
                                            Respond within 15 minutes!
                                        </span>
                                    </div>
                                    {leads.HOT.map(lead => <LeadCard key={lead._id} lead={lead} tier="HOT" />)}
                                </div>
                            )}

                            {/* WARM LEADS */}
                            {leads.WARM.length > 0 && (
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <span style={{ fontSize: '28px' }}>⚡</span>
                                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '700', color: 'white' }}>
                                            WARM Leads ({leads.WARM.length})
                                        </h2>
                                        <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: '12px', fontWeight: '600' }}>
                                            Respond within 1 hour
                                        </span>
                                    </div>
                                    {leads.WARM.map(lead => <LeadCard key={lead._id} lead={lead} tier="WARM" />)}
                                </div>
                            )}

                            {/* COLD LEADS */}
                            {leads.COLD.length > 0 && (
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <span style={{ fontSize: '28px' }}>💙</span>
                                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '700', color: 'white' }}>
                                            COLD Leads ({leads.COLD.length})
                                        </h2>
                                        <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '12px', fontWeight: '600' }}>
                                            Respond within 4 hours
                                        </span>
                                    </div>
                                    {leads.COLD.map(lead => <LeadCard key={lead._id} lead={lead} tier="COLD" />)}
                                </div>
                            )}

                            {/* LOW LEADS */}
                            {leads.LOW.length > 0 && (
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <span style={{ fontSize: '28px' }}>🌫️</span>
                                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '700', color: 'white' }}>
                                            LOW Priority ({leads.LOW.length})
                                        </h2>
                                        <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.3)', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                                            Respond within 24 hours
                                        </span>
                                    </div>
                                    {leads.LOW.map(lead => <LeadCard key={lead._id} lead={lead} tier="LOW" />)}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setSelectedLead(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass card"
                        style={{ maxWidth: '600px', width: '100%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '22px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>
                            Lead Details
                        </h2>

                        {/* Buyer Info */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>BUYER INFORMATION</h3>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>{selectedLead.buyer?.name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>📧 {selectedLead.buyer?.email}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>📱 {selectedLead.buyer?.phone || 'N/A'}</div>
                                {selectedLead.buyer?.profession && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>💼 {selectedLead.buyer.profession}</div>}
                            </div>
                        </div>

                        {/* Property Info */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>PROPERTY</h3>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>{selectedLead.property?.title}</div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '8px' }}>{priceAbbr(selectedLead.property?.price)}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {selectedLead.property?.bedrooms && `🛏 ${selectedLead.property.bedrooms}BHK • `}
                                    {selectedLead.property?.area && `📐 ${selectedLead.property.area} sqft`}
                                </div>
                            </div>
                        </div>

                        {/* Score Breakdown */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>SCORE BREAKDOWN</h3>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Space Grotesk', color: 'white', marginBottom: '16px' }}>
                                    {selectedLead.scores.total} / 100
                                </div>
                                {[
                                    { label: 'Profile Quality', value: selectedLead.scores.profile, max: 15 },
                                    { label: 'Property Exploration', value: selectedLead.scores.exploration, max: 25 },
                                    { label: 'Engagement', value: selectedLead.scores.engagement, max: 20 },
                                    { label: 'AI Interaction', value: selectedLead.scores.aiInteraction, max: 15 },
                                    { label: 'Owner Contact', value: selectedLead.scores.ownerContact, max: 25 },
                                    { label: 'Bonus Points', value: selectedLead.scores.bonus, max: 10 },
                                ].map(item => (
                                    <div key={item.label} style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                            <span style={{ color: 'white', fontWeight: '600' }}>{item.value} / {item.max}</span>
                                        </div>
                                        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(item.value / item.max) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '3px' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity Summary */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>ACTIVITY SUMMARY</h3>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Views:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking.viewCount}</span></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Time Spent:</span> <span style={{ color: 'white', fontWeight: '600' }}>{Math.floor(selectedLead.tracking.pageViewTime / 60)}m</span></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Scroll Depth:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking.scrollDepth}%</span></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Q&A Read:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking.qaAnswersRead}/{selectedLead.tracking.qaTotalAnswers}</span></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>AI Questions:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking.aiQuestionsAsked}</span></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>First Viewed:</span> <span style={{ color: 'white', fontWeight: '600' }}>{formatTime(selectedLead.tracking.firstViewedAt)}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* SLA Calculation Details */}
                        {selectedLead.sla?.calculationDetails && (
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>SLA CALCULATION (DYNAMIC)</h3>
                                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                    <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Base SLA (from tier):</span>{' '}
                                            <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.sla.calculationDetails.baseSLA} min</span>
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Your Queue Size:</span>{' '}
                                            <span style={{ color: '#60a5fa', fontWeight: '600' }}>{selectedLead.sla.calculationDetails.queueSize} leads</span>
                                            {' '}(×{selectedLead.sla.calculationDetails.queueMultiplier})
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Pending Responses:</span>{' '}
                                            <span style={{ color: '#f59e0b', fontWeight: '600' }}>{selectedLead.sla.calculationDetails.activeLeads} leads</span>
                                            {' '}(×{selectedLead.sla.calculationDetails.activeMultiplier})
                                        </div>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
                                        <div>
                                            <span style={{ color: 'var(--text-muted)' }}>Final SLA:</span>{' '}
                                            <span style={{ color: '#10b981', fontWeight: '700', fontSize: '16px' }}>
                                                {selectedLead.sla.expectedResponseTime} min
                                            </span>
                                            {' '}
                                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                                ({Math.floor(selectedLead.sla.expectedResponseTime / 60)}h {selectedLead.sla.expectedResponseTime % 60}m)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    💡 SLA adjusted based on your current workload for fair buyer expectations
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedLead(null)}
                            className="btn btn-secondary"
                            style={{ width: '100%' }}
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Transfer Lead Modal */}
            {showTransferModal && transferringLead && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => {
                    setShowTransferModal(false);
                    setTransferringLead(null);
                    setSelectedTeamMember('');
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass card"
                        style={{ maxWidth: '500px', width: '100%', padding: '32px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '22px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                            Transfer Lead
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                            Select a team member to handle this lead
                        </p>

                        {/* Lead Summary */}
                        <div style={{
                            padding: '16px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                                {transferringLead.buyer?.name}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {transferringLead.property?.title}
                            </div>
                        </div>

                        {/* Team Member Selection */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '12px' }}>
                                SELECT TEAM MEMBER
                            </label>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {teamMembers.map(member => (
                                    <button
                                        key={member.userId}
                                        onClick={() => setSelectedTeamMember(member.userId)}
                                        style={{
                                            padding: '12px 16px',
                                            background: selectedTeamMember === member.userId ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.02)',
                                            border: selectedTeamMember === member.userId ? '2px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{member.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {member.email} • {member.role}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    setShowTransferModal(false);
                                    setTransferringLead(null);
                                    setSelectedTeamMember('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTransferLead}
                                disabled={!selectedTeamMember || transferring}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: selectedTeamMember && !transferring ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(59,130,246,0.3)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: selectedTeamMember && !transferring ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {transferring ? 'Transferring...' : 'Transfer Lead'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LeadDashboard;
