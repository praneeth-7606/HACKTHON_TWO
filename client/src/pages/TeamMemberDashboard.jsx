import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
        api.get('/users/me')
            .then(r => {
                const u = r.data.data.user;
                setUser(u);
                // Allow access if user is a team member (even if they're also a seller)
                // This page is specifically for viewing assigned leads
            })
            .catch(() => navigate('/auth'));
        
        fetchAssignedLeads();
        
        // Poll for new leads every 5 seconds
        const interval = setInterval(fetchAssignedLeads, 5000);
        return () => clearInterval(interval);
    }, [navigate]);

    const fetchAssignedLeads = async () => {
        setLoading(true);
        try {
            const res = await api.get('/team-members/leads/assigned');
            setLeads(res.data.data.leads || []);
        } catch (err) {
            console.error('Failed to fetch assigned leads:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsResponded = async (leadId) => {
        try {
            await api.patch(`/leads/lead/${leadId}/respond`);
            fetchAssignedLeads();
        } catch (err) {
            alert('Failed to mark as responded');
        }
    };

    const markAsComplete = async (leadId) => {
        try {
            await api.patch(`/leads/lead/${leadId}/complete`);
            fetchAssignedLeads();
        } catch (err) {
            alert('Failed to mark as complete');
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

    const LeadCard = ({ lead }) => {
        const slaStatus = getSLAStatus(lead);

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{
                                padding: '4px 10px', borderRadius: '6px',
                                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                                color: '#60a5fa', fontSize: '11px', fontWeight: '700'
                            }}>
                                📋 Assigned to You
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

                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            👤 From: <strong>{lead.seller?.name}</strong>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>👁️ {lead.tracking.viewCount} views</span>
                            <span>⏱️ {Math.floor(lead.tracking.pageViewTime / 60)}m spent</span>
                            {lead.tracking.messageSent && <span>✉️ Messaged</span>}
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
                                navigate(`/messages?contactId=${lead.buyer._id}&propertyId=${lead.property._id}`);
                            }}
                            style={{
                                padding: '8px 16px', borderRadius: '8px',
                                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                                color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            💬 Message
                        </button>
                        {lead.status !== 'COMPLETED' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAsComplete(lead._id);
                                }}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px',
                                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                                    color: '#d8b4fe', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                ✅ Mark Complete
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    if (!user) return null;

    return (
        <div className="bg-dashboard">
            <div className="grid-pattern" />
            <Navbar user={user} />

            {/* SIDEBAR */}
            <div className="sidebar" style={{ top: '64px' }}>
                {[
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'My Assigned Leads', active: true, action: () => {} },
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
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#6ee7b7' }}>Team Member Mode</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>Viewing leads assigned to you</div>
                </div>
            </div>

            <div className="main-content">
                <div className="page-inner">
                    {/* Header */}
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-blue)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Team Member Dashboard</div>
                        <h1 className="heading-xl gradient-text" style={{ marginBottom: '8px' }}>My Assigned Leads</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Leads transferred to you by your seller. Handle inquiries and close deals.</p>
                    </div>

                    {/* Stats */}
                    <div className="grid-4" style={{ marginBottom: '40px' }}>
                        {[
                            { icon: '📋', label: 'Total Assigned', value: leads.length },
                            { icon: '⏳', label: 'Pending Response', value: leads.filter(l => !l.sla.responded).length },
                            { icon: '✅', label: 'Responded', value: leads.filter(l => l.sla.responded).length },
                            { icon: '🎯', label: 'Completed', value: leads.filter(l => l.status === 'COMPLETED').length },
                        ].map(s => (
                            <div key={s.label} className="stat-card">
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{s.icon}</div>
                                <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Space Grotesk', color: 'white' }}>{s.value}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <div style={{ width: '40px', height: '40px', margin: '0 auto 16px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            Loading assigned leads...
                        </div>
                    ) : leads.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 40px', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.07)' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>No assigned leads yet</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>When your seller transfers leads to you, they'll appear here.</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <span style={{ fontSize: '28px' }}>📋</span>
                                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '700', color: 'white' }}>
                                    Assigned Leads ({leads.length})
                                </h2>
                            </div>
                            {leads.map(lead => <LeadCard key={lead._id} lead={lead} />)}
                        </div>
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

                        {/* Seller Info */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>TRANSFERRED FROM</h3>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>{selectedLead.seller?.name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📧 {selectedLead.seller?.email}</div>
                            </div>
                        </div>

                        {/* Activity Summary */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>ACTIVITY SUMMARY</h3>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Views:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.tracking.viewCount}</span></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Time Spent:</span> <span style={{ color: 'white', fontWeight: '600' }}>{Math.floor(selectedLead.tracking.pageViewTime / 60)}m</span></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span style={{ color: 'white', fontWeight: '600' }}>{selectedLead.status}</span></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Assigned:</span> <span style={{ color: 'white', fontWeight: '600' }}>{formatTime(selectedLead.transferredAt)}</span></div>
                                </div>
                            </div>
                        </div>

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

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default TeamMemberDashboard;
