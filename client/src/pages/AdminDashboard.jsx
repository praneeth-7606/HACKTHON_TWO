import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/Toast';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const res = await api.get('/admin/dashboard/stats');
            setStats(res.data.data);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Failed to load stats', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 text-lg">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="mb-12 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
                                <p className="text-slate-400 mt-1">Manage users, properties, and platform analytics</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/50 hover:shadow-red-500/70 flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        title="Total Users"
                        value={stats?.stats.users.total || 0}
                        subtitle={`${stats?.stats.users.active || 0} active`}
                        icon="👥"
                        gradient="from-blue-500 to-cyan-500"
                        onClick={() => navigate('/admin/users')}
                    />
                    <StatCard
                        title="Buyers"
                        value={stats?.stats.users.buyers || 0}
                        subtitle="Registered buyers"
                        icon="🏡"
                        gradient="from-emerald-500 to-green-500"
                        onClick={() => navigate('/admin/users?role=buyer')}
                    />
                    <StatCard
                        title="Sellers"
                        value={stats?.stats.users.sellers || 0}
                        subtitle="Registered sellers"
                        icon="🏢"
                        gradient="from-purple-500 to-pink-500"
                        onClick={() => navigate('/admin/users?role=seller')}
                    />
                    <StatCard
                        title="Total Leads"
                        value={stats?.stats.leads || 0}
                        subtitle="Platform leads"
                        icon="📈"
                        gradient="from-orange-500 to-red-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard
                        title="Total Properties"
                        value={stats?.stats.properties.total || 0}
                        subtitle="All listings"
                        icon="🏘️"
                        gradient="from-indigo-500 to-blue-500"
                        onClick={() => navigate('/admin/properties')}
                    />
                    <StatCard
                        title="Pending Approval"
                        value={stats?.stats.properties.pending || 0}
                        subtitle="Awaiting review"
                        icon="⏳"
                        gradient="from-amber-500 to-orange-500"
                        onClick={() => navigate('/admin/properties/pending')}
                        highlight={stats?.stats.properties.pending > 0}
                    />
                    <StatCard
                        title="Approved"
                        value={stats?.stats.properties.approved || 0}
                        subtitle="Live properties"
                        icon="✅"
                        gradient="from-emerald-500 to-teal-500"
                    />
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700 mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="group bg-gradient-to-br from-slate-800 to-slate-900 hover:from-blue-900 hover:to-slate-900 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-all duration-300 text-left"
                        >
                            <div className="text-4xl mb-3">👥</div>
                            <div className="text-white font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">Manage Users</div>
                            <div className="text-slate-400 text-sm">View and control user accounts</div>
                        </button>
                        <button
                            onClick={() => navigate('/admin/properties/pending')}
                            className="group bg-gradient-to-br from-slate-800 to-slate-900 hover:from-amber-900 hover:to-slate-900 p-6 rounded-xl border border-slate-700 hover:border-amber-500 transition-all duration-300 text-left"
                        >
                            <div className="text-4xl mb-3">⏳</div>
                            <div className="text-white font-semibold text-lg mb-1 group-hover:text-amber-400 transition-colors">Pending Approvals</div>
                            <div className="text-slate-400 text-sm">Review property submissions</div>
                        </button>
                        <button
                            onClick={() => navigate('/admin/logs')}
                            className="group bg-gradient-to-br from-slate-800 to-slate-900 hover:from-purple-900 hover:to-slate-900 p-6 rounded-xl border border-slate-700 hover:border-purple-500 transition-all duration-300 text-left"
                        >
                            <div className="text-4xl mb-3">📋</div>
                            <div className="text-white font-semibold text-lg mb-1 group-hover:text-purple-400 transition-colors">Activity Logs</div>
                            <div className="text-slate-400 text-sm">View admin actions</div>
                        </button>
                        <button
                            onClick={() => navigate('/admin/scoring')}
                            className="group bg-gradient-to-br from-slate-800 to-slate-900 hover:from-indigo-900 hover:to-slate-900 p-6 rounded-xl border border-slate-700 hover:border-indigo-500 transition-all duration-300 text-left"
                        >
                            <div className="text-4xl mb-3">📊</div>
                            <div className="text-white font-semibold text-lg mb-1 group-hover:text-indigo-400 transition-colors">Scoring Mechanisms</div>
                            <div className="text-slate-400 text-sm">View all algorithms</div>
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Recent Users
                        </h2>
                        <div className="space-y-3">
                            {stats?.recentUsers?.map(user => (
                                <div key={user._id} className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all duration-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{user.name}</div>
                                                <div className="text-slate-400 text-sm">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-1">
                                                {user.role}
                                            </div>
                                            <div className="text-slate-500 text-xs">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Recent Properties
                        </h2>
                        <div className="space-y-3">
                            {stats?.recentProperties?.map(property => (
                                <div key={property._id} className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all duration-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="text-white font-medium mb-1">{property.title}</div>
                                            <div className="text-slate-400 text-sm flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                                {property.location}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-emerald-400 font-bold text-lg">
                                                ₹{(property.price / 100000).toFixed(1)}L
                                            </div>
                                            <div className="text-slate-500 text-xs">
                                                {property.seller?.name}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

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

function StatCard({ title, value, subtitle, icon, gradient, onClick, highlight }) {
    return (
        <div
            onClick={onClick}
            className={`group relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border transition-all duration-300 ${
                onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl' : ''
            } ${
                highlight 
                    ? 'border-amber-500 shadow-lg shadow-amber-500/20' 
                    : 'border-slate-700 hover:border-slate-600'
            }`}
        >
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
            
            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20`}>
                        {icon}
                    </div>
                    {highlight && (
                        <div className="animate-pulse">
                            <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                    )}
                </div>
                
                <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">{title}</p>
                    <p className="text-white text-4xl font-bold mb-1">{value}</p>
                    <p className="text-slate-500 text-sm">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}
