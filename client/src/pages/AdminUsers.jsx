import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/Toast';

export default function AdminUsers() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [filters, setFilters] = useState({
        role: searchParams.get('role') || 'all',
        status: searchParams.get('status') || 'all',
        search: searchParams.get('search') || ''
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.role !== 'all') params.append('role', filters.role);
            if (filters.status !== 'all') params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);

            const res = await api.get(`/admin/users?${params.toString()}`);
            setUsers(res.data.data.users);
        } catch (err) {
            setToast({ show: true, message: 'Failed to load users', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus, reason) => {
        try {
            await api.patch(`/admin/users/${selectedUser._id}/status`, {
                accountStatus: newStatus,
                statusReason: reason
            });
            setToast({ show: true, message: 'User status updated successfully', type: 'success' });
            setShowStatusModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Failed to update status', type: 'error' });
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
            suspended: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            banned: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badges[status]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
                        <p className="text-slate-400">Manage all platform users</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 border border-slate-700 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                            <option value="all">All Roles</option>
                            <option value="buyer">Buyers</option>
                            <option value="seller">Sellers</option>
                            <option value="admin">Admins</option>
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                            <option value="banned">Banned</option>
                        </select>
                        <button
                            onClick={fetchUsers}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/50"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="text-6xl mb-4 opacity-20">👥</div>
                            <p className="text-slate-500">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900/50 border-b border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Stats</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {users.map(user => (
                                        <tr key={user._id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {user.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">{user.name}</div>
                                                        <div className="text-slate-400 text-sm">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(user.accountStatus)}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-300">
                                                    {user.role === 'seller' && (
                                                        <div>
                                                            <div>Listed: <span className="text-white font-semibold">{user.propertiesListed || 0}</span></div>
                                                            <div className="text-slate-500">Approved: {user.propertiesApproved || 0}</div>
                                                        </div>
                                                    )}
                                                    {user.role === 'buyer' && (
                                                        <div>
                                                            <div>Leads: <span className="text-white font-semibold">{user.leadsGenerated || 0}</span></div>
                                                            <div className="text-slate-500">Saved: {user.savedPropertiesCount || 0}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowStatusModal(true);
                                                    }}
                                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                                >
                                                    Change Status
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && (
                <StatusModal
                    user={selectedUser}
                    onClose={() => setShowStatusModal(false)}
                    onSubmit={handleStatusChange}
                />
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

function StatusModal({ user, onClose, onSubmit }) {
    const [status, setStatus] = useState(user.accountStatus);
    const [reason, setReason] = useState('');

    // Seller punishment rules
    const punishmentRules = {
        suspended: {
            title: '🚫 Account Suspension',
            duration: '7 Days',
            consequences: [
                'Cannot login to account',
                'All properties hidden from search',
                'Cannot receive new leads',
                'Requires admin approval to reactivate',
                'All properties auto-unhide upon reactivation'
            ],
            triggers: [
                'SLA breach at 200% of deadline',
                'Severe negligence in responding to buyers',
                'Multiple consecutive SLA breaches'
            ],
            color: 'amber'
        },
        flagged: {
            title: '⚠️ Account Flagged',
            duration: 'Ongoing',
            consequences: [
                'Properties hidden for 24 hours',
                'Seller rating drops by 10 points',
                'Account flagged for admin review',
                'Buyer receives apology email',
                'Seller receives warning email'
            ],
            triggers: [
                'SLA breach at 150% of deadline',
                'Critical delay in responding',
                'Poor response rate'
            ],
            color: 'orange'
        },
        banned: {
            title: '🔴 Account Banned',
            duration: 'Permanent',
            consequences: [
                'Permanent account suspension',
                'All properties permanently hidden',
                'Cannot login or access platform',
                'Cannot list new properties',
                'All leads forfeited'
            ],
            triggers: [
                'Repeated violations',
                'Fraudulent activity',
                'Severe misconduct'
            ],
            color: 'red'
        }
    };

    const getRuleColor = (color) => {
        const colors = {
            amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
            orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
            red: 'from-red-500/20 to-rose-500/20 border-red-500/30'
        };
        return colors[color] || colors.amber;
    };

    const getRuleTextColor = (color) => {
        const colors = {
            amber: 'text-amber-400',
            orange: 'text-orange-400',
            red: 'text-red-400'
        };
        return colors[color] || colors.amber;
    };

    const selectedRule = punishmentRules[status];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Change User Status</h3>
                            <p className="text-slate-400">Manage account status and apply consequences</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* User Info */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {user.name[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-semibold">{user.name}</p>
                                <p className="text-slate-400 text-sm">{user.email}</p>
                                <p className="text-slate-500 text-xs mt-1">Role: <span className="text-slate-300 font-medium">{user.role}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Status Selection */}
                    <div>
                        <label className="block text-white font-semibold mb-3">Select New Status</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['active', 'inactive', 'suspended', 'banned'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={`p-3 rounded-lg border-2 transition-all font-medium ${
                                        status === s
                                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                                    }`}
                                >
                                    {s === 'active' && '✅ Active'}
                                    {s === 'inactive' && '⏸️ Inactive'}
                                    {s === 'suspended' && '🚫 Suspended'}
                                    {s === 'banned' && '🔴 Banned'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Punishment Rules - Only show for sellers */}
                    {user.role === 'seller' && status !== 'active' && status !== 'inactive' && selectedRule && (
                        <div className={`bg-gradient-to-br ${getRuleColor(selectedRule.color)} rounded-xl p-4 border`}>
                            <div className="flex items-start gap-3 mb-4">
                                <span className="text-2xl">{selectedRule.title.split(' ')[0]}</span>
                                <div>
                                    <h4 className={`font-bold ${getRuleTextColor(selectedRule.color)}`}>
                                        {selectedRule.title}
                                    </h4>
                                    <p className="text-slate-300 text-sm">Duration: <span className="font-semibold">{selectedRule.duration}</span></p>
                                </div>
                            </div>

                            {/* Consequences */}
                            <div className="mb-4">
                                <p className="text-slate-300 font-semibold text-sm mb-2">📋 Consequences:</p>
                                <ul className="space-y-1">
                                    {selectedRule.consequences.map((consequence, idx) => (
                                        <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                                            <span className="text-red-400 mt-0.5">•</span>
                                            <span>{consequence}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Triggers */}
                            <div>
                                <p className="text-slate-300 font-semibold text-sm mb-2">⚡ Triggers:</p>
                                <ul className="space-y-1">
                                    {selectedRule.triggers.map((trigger, idx) => (
                                        <li key={idx} className="text-slate-400 text-sm flex items-start gap-2">
                                            <span className="text-yellow-400 mt-0.5">→</span>
                                            <span>{trigger}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Seller Rating Info */}
                    {user.role === 'seller' && user.sellerRating && (
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <p className="text-white font-semibold mb-3">📊 Seller Performance</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-slate-400 text-sm">Rating Score</p>
                                    <p className="text-white font-bold text-lg">{user.sellerRating.score}/100</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Tier</p>
                                    <p className="text-white font-bold text-lg capitalize">{user.sellerRating.tier}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Response Rate</p>
                                    <p className="text-white font-bold">{user.sellerRating.responseRate}%</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">SLA Breaches</p>
                                    <p className="text-red-400 font-bold">{user.sellerRating.slaBreaches}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-white font-semibold mb-3">Reason for Status Change</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you're changing the status... (This will be sent to the user)"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                            rows="4"
                        />
                    </div>

                    {/* Warning for Suspension */}
                    {status === 'suspended' && user.role === 'seller' && (
                        <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
                            <p className="text-amber-300 text-sm flex items-start gap-2">
                                <span className="text-lg mt-0.5">⚠️</span>
                                <span>
                                    <strong>Note:</strong> When this seller is reactivated, all their properties will be automatically unhidden and restored to search results.
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700 p-6 flex gap-3">
                    <button
                        onClick={() => onSubmit(status, reason)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-blue-500/50"
                    >
                        Update Status
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all duration-200 border border-slate-700"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
