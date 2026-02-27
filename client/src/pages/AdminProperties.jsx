import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import api from '../services/api';
import Toast from '../components/Toast';

export default function AdminProperties() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [filter, setFilter] = useState('pending');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('approve');
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        api.get('/users/me').then(r => setUser(r.data.data.user)).catch(() => navigate('/auth'));
        fetchProperties();
    }, [filter]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const endpoint = filter === 'pending' ? '/admin/properties/pending' : `/admin/properties?status=${filter}`;
            const res = await api.get(endpoint);
            setProperties(res.data.data.properties);
        } catch (err) { setToast({ show: true, message: 'Failed to load properties', type: 'error' }); }
        finally { setLoading(false); }
    };

    const handleApprove = async () => {
        try {
            await api.patch(`/admin/properties/${selectedProperty._id}/approve`, { adminNotes: notes });
            setToast({ show: true, message: 'Property approved successfully', type: 'success' });
            setShowModal(false); setNotes(''); fetchProperties();
        } catch (err) { setToast({ show: true, message: 'Failed to approve', type: 'error' }); }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) { setToast({ show: true, message: 'Please provide a rejection reason', type: 'error' }); return; }
        try {
            await api.patch(`/admin/properties/${selectedProperty._id}/reject`, { rejectionReason, adminNotes: notes });
            setToast({ show: true, message: 'Property rejected', type: 'success' });
            setShowModal(false); setNotes(''); setRejectionReason(''); fetchProperties();
        } catch (err) { setToast({ show: true, message: 'Failed to reject', type: 'error' }); }
    };

    const approveAllExisting = async () => {
        if (!confirm('Approve all existing properties?')) return;
        try {
            const res = await api.post('/admin/properties/approve-existing');
            setToast({ show: true, message: `Approved ${res.data.data.count} properties`, type: 'success' });
            fetchProperties();
        } catch (err) { setToast({ show: true, message: 'Failed', type: 'error' }); }
    };

    const statusConfig = {
        pending: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24', icon: '⏳', label: 'PENDING' },
        approved: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#6ee7b7', icon: '✓', label: 'APPROVED' },
        rejected: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#fca5a5', icon: '✕', label: 'REJECTED' },
        under_review: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', color: '#93c5fd', icon: '👁', label: 'REVIEW' },
    };

    const inputStyle = { width: '100%', padding: '14px 18px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'Inter', resize: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };

    return (
        <div className="bg-dashboard">
            <div className="grid-pattern" />
            <Navbar user={user} />

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 32px 60px', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <motion.button whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin')}
                            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>←</motion.button>
                        <div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>Property Management</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Review and approve property listings</p>
                        </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={approveAllExisting}
                        style={{ padding: '10px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                        ✓ Approve All Existing
                    </motion.button>
                </motion.div>

                {/* Filter Tabs */}
                <div className="glass" style={{ marginBottom: '24px', padding: '6px', borderRadius: '16px', display: 'flex', gap: '4px' }}>
                    {['pending', 'approved', 'rejected', 'all'].map(tab => (
                        <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setFilter(tab)}
                            style={{
                                flex: 1, padding: '10px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', textTransform: 'capitalize', transition: 'all 0.2s',
                                background: filter === tab ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                                color: filter === tab ? 'white' : 'var(--text-muted)',
                                boxShadow: filter === tab ? '0 4px 16px rgba(59,130,246,0.3)' : 'none'
                            }}>
                            {tab === 'pending' && '⏳ '}{tab === 'approved' && '✓ '}{tab === 'rejected' && '✕ '}{tab === 'all' && '📋 '}{tab}
                        </motion.button>
                    ))}
                </div>

                {/* Properties Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                                <div className="skeleton" style={{ height: '200px', borderRadius: 0 }} />
                                <div style={{ padding: '20px' }}>
                                    <div className="skeleton skeleton-title" style={{ width: '70%', marginBottom: '10px' }} />
                                    <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: '16px' }} />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '10px' }} />
                                        <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '10px' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    <div className="empty-state" style={{ border: '2px dashed rgba(255,255,255,0.07)', borderRadius: '24px' }}>
                        <div className="empty-state-icon">🏘️</div>
                        <h3>No properties found</h3>
                        <p>No properties match the "{filter}" filter.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                        {properties.map((property, i) => {
                            const sc = statusConfig[property.approvalStatus] || statusConfig.pending;
                            return (
                                <motion.div key={property._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, type: 'spring', damping: 25 }}
                                    whileHover={{ y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.4)' }}
                                    style={{ borderRadius: '20px', overflow: 'hidden', background: 'rgba(13,21,38,0.9)', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.3s' }}>

                                    {/* Image */}
                                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                                        <img src={property.images?.[0] || ''} alt={property.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                            onError={e => { e.target.style.display = 'none'; }}
                                            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                            onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,21,38,0.95) 0%, rgba(13,21,38,0.3) 50%, transparent 100%)' }} />

                                        {/* Status badge */}
                                        <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 12px', borderRadius: '8px', background: sc.bg, border: `1px solid ${sc.border}`, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontSize: '11px' }}>{sc.icon}</span>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: sc.color, letterSpacing: '0.8px' }}>{sc.label}</span>
                                        </div>

                                        {/* Price */}
                                        <div style={{ position: 'absolute', bottom: '12px', left: '16px' }}>
                                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#6ee7b7', fontFamily: 'Space Grotesk' }}>
                                                ₹{property.price >= 10000000 ? `${(property.price / 10000000).toFixed(1)}Cr` : `${(property.price / 100000).toFixed(1)}L`}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{property.propertyType} • {property.listingType}</div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '18px 20px 20px' }}>
                                        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '16px', color: 'white', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            {property.location}
                                        </div>

                                        {/* Seller */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '14px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: 'white' }}>
                                                {property.seller?.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.seller?.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    {new Date(property.submittedForApproval || property.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                            {property.bedrooms && <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>🛏 {property.bedrooms}BHK</span>}
                                        </div>

                                        {/* ═══ ACTION ROW — SIDE BY SIDE ═══ */}
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {property.approvalStatus === 'pending' && (
                                                <>
                                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => { setSelectedProperty(property); setModalType('approve'); setShowModal(true); }}
                                                        style={{ flex: 1, padding: '9px 0', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                                                        Approve
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => { setSelectedProperty(property); setModalType('reject'); setShowModal(true); }}
                                                        style={{ flex: 1, padding: '9px 0', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                                        Reject
                                                    </motion.button>
                                                </>
                                            )}

                                            {property.approvalStatus === 'approved' && (
                                                <>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#6ee7b7' }}>Live</span>
                                                    </div>
                                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => { setSelectedProperty(property); setModalType('reject'); setShowModal(true); }}
                                                        style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                                        Reject
                                                    </motion.button>
                                                </>
                                            )}

                                            {property.approvalStatus === 'rejected' && property.rejectionReason && (
                                                <>
                                                    <div style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#fca5a5', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rejection Reason</div>
                                                        <div style={{ fontSize: '12px', color: 'rgba(252,165,165,0.7)', lineHeight: 1.5 }}>{property.rejectionReason}</div>
                                                    </div>
                                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => { setSelectedProperty(property); setModalType('approve'); setShowModal(true); }}
                                                        style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                                                        Approve
                                                    </motion.button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Approve/Reject Modal */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', zIndex: 9998 }} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ type: 'spring', damping: 25 }}
                            style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '100%', maxWidth: '600px', maxHeight: 'calc(100vh - 120px)', overflow: 'auto', borderRadius: '24px', background: 'rgba(13,21,38,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
                            onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: modalType === 'approve' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                        {modalType === 'approve' ? '✓' : '✕'}
                                    </div>
                                    <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: '700', color: 'white' }}>
                                        {modalType === 'approve' ? 'Approve' : 'Reject'} Property
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>×</button>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '24px 28px' }}>
                                {/* Property preview */}
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                                    <div style={{ width: '80px', height: '60px', borderRadius: '10px', background: selectedProperty?.images?.[0] ? `url(${selectedProperty.images[0]}) center/cover` : 'linear-gradient(135deg, #1e293b, #334155)', flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{selectedProperty?.title}</div>
                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#6ee7b7', fontFamily: 'Space Grotesk' }}>₹{(selectedProperty?.price / 100000).toFixed(1)}L</div>
                                    </div>
                                </div>

                                {modalType === 'reject' && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>Rejection Reason *</label>
                                        <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows="3" placeholder="Explain why this property is being rejected..." style={inputStyle} />
                                    </div>
                                )}

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>Admin Notes (optional)</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" placeholder="Internal notes..." style={inputStyle} />
                                </div>

                                {/* Actions — SIDE BY SIDE */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={modalType === 'approve' ? handleApprove : handleReject}
                                        style={{
                                            flex: 1, padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: 'white',
                                            background: modalType === 'approve' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                            boxShadow: modalType === 'approve' ? '0 8px 24px rgba(16,185,129,0.3)' : '0 8px 24px rgba(239,68,68,0.3)'
                                        }}>
                                        {modalType === 'approve' ? '✓ Approve Property' : '✕ Reject Property'}
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => { setShowModal(false); setNotes(''); setRejectionReason(''); }}
                                        style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                        Cancel
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
        </div>
    );
}
