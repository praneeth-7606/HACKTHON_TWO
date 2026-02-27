import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/Toast';

export default function AdminProperties() {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [filter, setFilter] = useState('pending');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('approve'); // 'approve' or 'reject'
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchProperties();
    }, [filter]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const endpoint = filter === 'pending' 
                ? '/admin/properties/pending'
                : `/admin/properties?status=${filter}`;
            const res = await api.get(endpoint);
            setProperties(res.data.data.properties);
        } catch (err) {
            setToast({ show: true, message: 'Failed to load properties', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            await api.patch(`/admin/properties/${selectedProperty._id}/approve`, {
                adminNotes: notes
            });
            setToast({ show: true, message: 'Property approved successfully', type: 'success' });
            setShowModal(false);
            setNotes('');
            fetchProperties();
        } catch (err) {
            setToast({ show: true, message: 'Failed to approve property', type: 'error' });
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            setToast({ show: true, message: 'Please provide a rejection reason', type: 'error' });
            return;
        }
        try {
            await api.patch(`/admin/properties/${selectedProperty._id}/reject`, {
                rejectionReason,
                adminNotes: notes
            });
            setToast({ show: true, message: 'Property rejected', type: 'success' });
            setShowModal(false);
            setNotes('');
            setRejectionReason('');
            fetchProperties();
        } catch (err) {
            setToast({ show: true, message: 'Failed to reject property', type: 'error' });
        }
    };

    const approveAllExisting = async () => {
        if (!confirm('Approve all existing properties? This is a one-time migration action.')) return;
        try {
            const res = await api.post('/admin/properties/approve-existing');
            setToast({ 
                show: true, 
                message: `Approved ${res.data.data.count} existing properties`, 
                type: 'success' 
            });
            fetchProperties();
        } catch (err) {
            setToast({ show: true, message: 'Failed to approve existing properties', type: 'error' });
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: {
                bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
                text: 'text-white',
                icon: '⏳'
            },
            approved: {
                bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
                text: 'text-white',
                icon: '✓'
            },
            rejected: {
                bg: 'bg-gradient-to-r from-red-500 to-rose-500',
                text: 'text-white',
                icon: '✕'
            },
            under_review: {
                bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
                text: 'text-white',
                icon: '👁'
            }
        };
        
        const badge = badges[status] || badges.pending;
        
        return (
            <span className={`${badge.bg} ${badge.text} px-3 py-1.5 text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-sm`}>
                <span>{badge.icon}</span>
                <span className="uppercase tracking-wider">{status.replace('_', ' ')}</span>
            </span>
        );
    };

    return (
        <div className="bg-dashboard" style={{ minHeight: '100vh', paddingTop: '80px' }}>
            <div className="grid-pattern"></div>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div>
                        <h1 className="heading-lg" style={{ color: 'white', marginBottom: '8px' }}>Property Management</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Review and approve property listings</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={approveAllExisting}
                            className="btn btn-primary"
                        >
                            Approve All Existing
                        </button>
                        <button
                            onClick={() => navigate('/admin')}
                            className="btn btn-secondary"
                        >
                            ← Back
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="glass card" style={{ marginBottom: '24px', padding: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['pending', 'approved', 'rejected', 'all'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className="btn"
                                style={{
                                    flex: 1,
                                    background: filter === tab ? 'linear-gradient(135deg, var(--accent-blue), #2563eb)' : 'transparent',
                                    color: filter === tab ? 'white' : 'var(--text-secondary)',
                                    border: filter === tab ? 'none' : '1px solid var(--border)',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Properties Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div className="loader" style={{ margin: '0 auto', width: '48px', height: '48px', borderWidth: '4px' }}></div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>Loading properties...</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="glass card" style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>🏘️</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>No properties found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map(property => (
                            <div 
                                key={property._id} 
                                className="group relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1"
                            >
                                {/* Image Container */}
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={property.images?.[0] || '/placeholder.jpg'}
                                        alt={property.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                                    
                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        {getStatusBadge(property.approvalStatus)}
                                    </div>
                                    
                                    {/* Price Tag */}
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-emerald-400 text-2xl font-bold">
                                                    ₹{(property.price / 100000).toFixed(1)}L
                                                </p>
                                                <p className="text-slate-300 text-xs mt-1">
                                                    {property.propertyType} • {property.listingType}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    {/* Title */}
                                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                                        {property.title}
                                    </h3>
                                    
                                    {/* Location */}
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="line-clamp-1">{property.location}</span>
                                    </div>

                                    {/* Property Details */}
                                    <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
                                        {property.bedrooms && (
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                </svg>
                                                <span>{property.bedrooms} BHK</span>
                                            </div>
                                        )}
                                        {property.area && (
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                </svg>
                                                <span>{property.area} {property.areaUnit}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Seller Info */}
                                    <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                {property.seller?.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{property.seller?.name}</p>
                                                <p className="text-slate-400 text-xs truncate">{property.seller?.email}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-700">
                                            <p className="text-slate-400 text-xs">
                                                Submitted: {new Date(property.submittedForApproval || property.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {property.approvalStatus === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedProperty(property);
                                                    setModalType('approve');
                                                    setShowModal(true);
                                                }}
                                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/50 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedProperty(property);
                                                    setModalType('reject');
                                                    setShowModal(true);
                                                }}
                                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Reject
                                            </button>
                                        </div>
                                    )}

                                    {/* Reject Button for Approved Properties */}
                                    {property.approvalStatus === 'approved' && (
                                        <button
                                            onClick={() => {
                                                setSelectedProperty(property);
                                                setModalType('reject');
                                                setShowModal(true);
                                            }}
                                            className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Reject Property
                                        </button>
                                    )}

                                    {/* Rejection Reason */}
                                    {property.approvalStatus === 'rejected' && property.rejectionReason && (
                                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div>
                                                    <p className="text-red-400 text-xs font-semibold mb-1">Rejection Reason:</p>
                                                    <p className="text-red-300 text-xs leading-relaxed">{property.rejectionReason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Approved Badge */}
                                    {property.approvalStatus === 'approved' && (
                                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-emerald-400 text-sm font-medium">Approved & Live</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approval/Rejection Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div 
                        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                {modalType === 'approve' ? (
                                    <>
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Approve Property
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Reject Property
                                    </>
                                )}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {/* Property Image */}
                            <div className="relative h-64 rounded-xl overflow-hidden mb-6 group">
                                <img
                                    src={selectedProperty.images?.[0]}
                                    alt={selectedProperty.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                            </div>

                            {/* Property Info */}
                            <div className="bg-slate-800/50 rounded-xl p-5 mb-6 border border-slate-700">
                                <h4 className="text-white font-bold text-xl mb-2">{selectedProperty.title}</h4>
                                <div className="flex items-center gap-2 text-slate-400 mb-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <span>{selectedProperty.location}</span>
                                </div>
                                <p className="text-emerald-400 font-bold text-3xl">₹{(selectedProperty.price / 100000).toFixed(1)}L</p>
                            </div>

                            {/* Rejection Reason Input */}
                            {modalType === 'reject' && (
                                <div className="mb-6">
                                    <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Rejection Reason *
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                                        rows="4"
                                        placeholder="Explain why this property is being rejected..."
                                    />
                                </div>
                            )}

                            {/* Admin Notes */}
                            <div className="mb-6">
                                <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Admin Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                    rows="3"
                                    placeholder="Add any internal notes..."
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-slate-900/50 p-6 flex gap-3 border-t border-slate-700">
                            <button
                                onClick={modalType === 'approve' ? handleApprove : handleReject}
                                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                                    modalType === 'approve'
                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70'
                                        : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/50 hover:shadow-red-500/70'
                                }`}
                            >
                                {modalType === 'approve' ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Approve Property
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Reject Property
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setNotes('');
                                    setRejectionReason('');
                                }}
                                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all duration-200 border border-slate-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
}
