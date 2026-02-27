import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Toast from '../components/Toast';

// Mini sparkline chart component
function Sparkline({ data = [], color = '#3b82f6', height = 32 }) {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (v / max) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height, overflow: 'visible' }}>
            <defs>
                <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                vectorEffect="non-scaling-stroke"
            />
            <polygon
                fill={`url(#sparkGrad-${color.replace('#', '')})`}
                points={`0,100 ${points} 100,100`}
            />
        </svg>
    );
}

// Circular health gauge component
function HealthGauge({ value, label, color, icon }) {
    const circumference = 2 * Math.PI * 38;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px' }}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <motion.circle
                        cx="48" cy="48" r="38" fill="none"
                        stroke={color} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: 'white', fontFamily: 'Space Grotesk' }}>{value}%</span>
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{label}</div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [activeTab, setActiveTab] = useState('users');

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

    // Generate sparkline data from stats
    const sparkData = useMemo(() => {
        const total = stats?.stats?.users?.total || 10;
        const gen = (base) => Array.from({ length: 7 }, (_, i) => Math.max(1, Math.round(base * (0.6 + Math.sin(i * 0.9) * 0.4 + i * 0.05))));
        return {
            users: gen(total / 7),
            buyers: gen((stats?.stats?.users?.buyers || 5) / 7),
            sellers: gen((stats?.stats?.users?.sellers || 5) / 7),
            leads: gen((stats?.stats?.leads || 8) / 7),
            properties: gen((stats?.stats?.properties?.total || 6) / 7),
        };
    }, [stats]);

    if (loading) {
        return (
            <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '80px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
                    {/* Skeleton header */}
                    <div style={{ marginBottom: '48px' }}>
                        <div className="skeleton skeleton-title" style={{ width: '300px', height: '32px' }} />
                        <div className="skeleton skeleton-text" style={{ width: '200px' }} />
                    </div>
                    {/* Skeleton stat cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '160px' }} />)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="skeleton skeleton-card" style={{ height: '300px' }} />
                        <div className="skeleton skeleton-card" style={{ height: '300px' }} />
                    </div>
                </div>
            </div>
        );
    }

    const kpis = [
        { title: 'Total Users', value: stats?.stats?.users?.total || 0, subtitle: `${stats?.stats?.users?.active || 0} active`, icon: '👥', color: '#3b82f6', data: sparkData.users, onClick: () => navigate('/admin/users') },
        { title: 'Buyers', value: stats?.stats?.users?.buyers || 0, subtitle: 'Registered buyers', icon: '🏡', color: '#10b981', data: sparkData.buyers, onClick: () => navigate('/admin/users?role=buyer') },
        { title: 'Sellers', value: stats?.stats?.users?.sellers || 0, subtitle: 'Property sellers', icon: '🏢', color: '#8b5cf6', data: sparkData.sellers, onClick: () => navigate('/admin/users?role=seller') },
        { title: 'Total Leads', value: stats?.stats?.leads || 0, subtitle: 'Platform-wide', icon: '📈', color: '#f59e0b', data: sparkData.leads },
    ];

    const quickActions = [
        { icon: '👥', title: 'Manage Users', desc: 'View, activate & control accounts', path: '/admin/users', accent: '#3b82f6' },
        { icon: '⏳', title: 'Pending Approvals', desc: `${stats?.stats?.properties?.pending || 0} awaiting review`, path: '/admin/properties/pending', accent: '#f59e0b', badge: stats?.stats?.properties?.pending || 0 },
        { icon: '🏘️', title: 'All Properties', desc: `${stats?.stats?.properties?.total || 0} total listings`, path: '/admin/properties', accent: '#10b981' },
        { icon: '📊', title: 'Scoring Engine', desc: 'Configure lead algorithms', path: '/admin/scoring', accent: '#8b5cf6' },
    ];

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '80px', paddingBottom: '48px' }}>
            {/* Ambient background */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: '-10%', left: '15%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            </div>

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>

                {/* ═══════════ HEADER ═══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(139,92,246,0.3)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '32px', fontWeight: '800', color: 'white', lineHeight: 1.2 }}>
                                Admin Dashboard
                            </h1>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Platform analytics & management
                            </p>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </motion.div>

                {/* ═══════════ KPI CARDS WITH SPARKLINES ═══════════ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    {kpis.map((kpi, i) => (
                        <motion.div
                            key={kpi.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            onClick={kpi.onClick}
                            className="glass"
                            style={{
                                padding: '24px', borderRadius: '20px',
                                cursor: kpi.onClick ? 'pointer' : 'default',
                                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                                position: 'relative', overflow: 'hidden',
                            }}
                            whileHover={kpi.onClick ? { y: -4, scale: 1.02 } : {}}
                        >
                            {/* Top accent line */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${kpi.color}, transparent)` }} />

                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
                                    {kpi.title}
                                </div>
                                <div style={{ fontSize: '24px' }}>{kpi.icon}</div>
                            </div>

                            <div style={{ fontSize: '36px', fontWeight: '800', color: 'white', fontFamily: 'Space Grotesk', lineHeight: 1, marginBottom: '4px' }}>
                                {kpi.value}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                {kpi.subtitle}
                            </div>

                            {/* Sparkline */}
                            <Sparkline data={kpi.data} color={kpi.color} height={36} />
                        </motion.div>
                    ))}
                </div>

                {/* ═══════════ PROPERTY STATS + SYSTEM HEALTH ═══════════ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    {/* Property Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="glass"
                        style={{ padding: '28px', borderRadius: '20px' }}
                    >
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            🏘️ Property Overview
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            {[
                                { label: 'Total', value: stats?.stats?.properties?.total || 0, color: '#3b82f6' },
                                { label: 'Pending', value: stats?.stats?.properties?.pending || 0, color: '#f59e0b' },
                                { label: 'Approved', value: stats?.stats?.properties?.approved || 0, color: '#10b981' },
                            ].map(p => (
                                <div key={p.label} style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: '800', color: p.color, fontFamily: 'Space Grotesk', marginBottom: '4px' }}>
                                        {p.value}
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {p.label}
                                    </div>
                                    {/* Progress bar showing ratio */}
                                    <div className="progress-bar" style={{ marginTop: '10px' }}>
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${stats?.stats?.properties?.total ? (p.value / stats.stats.properties.total) * 100 : 0}%`,
                                                background: `linear-gradient(90deg, ${p.color}, ${p.color}88)`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* System Health Gauges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass"
                        style={{ padding: '28px', borderRadius: '20px' }}
                    >
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            📡 System Health
                        </h2>
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <HealthGauge value={98} label="Uptime" color="#10b981" />
                            <HealthGauge
                                value={stats?.stats?.users?.total ? Math.min(100, Math.round((stats.stats.users.active / stats.stats.users.total) * 100)) : 85}
                                label="Active Users"
                                color="#3b82f6"
                            />
                            <HealthGauge
                                value={stats?.stats?.properties?.total ? Math.min(100, Math.round((stats.stats.properties.approved / stats.stats.properties.total) * 100)) : 90}
                                label="Approval Rate"
                                color="#8b5cf6"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* ═══════════ QUICK ACTIONS ═══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="glass"
                    style={{ padding: '28px', borderRadius: '20px', marginBottom: '32px' }}
                >
                    <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        ⚡ Quick Actions
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        {quickActions.map((action) => (
                            <motion.button
                                key={action.title}
                                onClick={() => navigate(action.path)}
                                whileHover={{ y: -4, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '24px 20px', borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border)',
                                    cursor: 'pointer', textAlign: 'left',
                                    transition: 'all 0.3s',
                                    position: 'relative', overflow: 'hidden',
                                }}
                            >
                                {/* Hover gradient */}
                                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${action.accent}15, transparent)`, opacity: 0, transition: 'opacity 0.3s' }} className="action-hover-bg" />

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '28px' }}>{action.icon}</span>
                                        {action.badge > 0 && (
                                            <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', background: `${action.accent}25`, color: action.accent, border: `1px solid ${action.accent}40` }}>
                                                {action.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{action.title}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{action.desc}</div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* ═══════════ ACTIVITY FEED WITH TABS ═══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass"
                    style={{ padding: '28px', borderRadius: '20px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            📋 Recent Activity
                        </h2>
                        <div className="tab-bar" style={{ display: 'inline-flex' }}>
                            <button className={`tab-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                                Users
                            </button>
                            <button className={`tab-item ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => setActiveTab('properties')}>
                                Properties
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'users' ? (
                            <motion.div
                                key="users"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                            >
                                {stats?.recentUsers?.length > 0 ? stats.recentUsers.map((user, i) => (
                                    <motion.div
                                        key={user._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 16px', borderRadius: '14px',
                                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                            transition: 'all 0.2s', cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '16px', fontWeight: '800', color: 'white',
                                            }}>
                                                {user.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{user.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span className="badge" style={{
                                                color: user.role === 'seller' ? '#8b5cf6' : user.role === 'admin' ? '#f59e0b' : '#10b981',
                                                background: user.role === 'seller' ? 'rgba(139,92,246,0.12)' : user.role === 'admin' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                                                borderColor: user.role === 'seller' ? 'rgba(139,92,246,0.3)' : user.role === 'admin' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)',
                                            }}>
                                                {user.role}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="empty-state" style={{ padding: '40px' }}>
                                        <div className="empty-state-icon">👥</div>
                                        <h3>No recent users</h3>
                                        <p>New user registrations will appear here</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="properties"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                            >
                                {stats?.recentProperties?.length > 0 ? stats.recentProperties.map((property, i) => (
                                    <motion.div
                                        key={property._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 16px', borderRadius: '14px',
                                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                            transition: 'all 0.2s', cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '2px' }}>{property.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                {property.location}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', fontFamily: 'Space Grotesk' }}>
                                                ₹{(property.price / 100000).toFixed(1)}L
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{property.seller?.name}</div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="empty-state" style={{ padding: '40px' }}>
                                        <div className="empty-state-icon">🏘️</div>
                                        <h3>No recent properties</h3>
                                        <p>New property listings will appear here</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
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
