import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await api.get('/users/logout');
        } catch (e) { }
        navigate('/auth');
    };

    const [notifications, setNotifications] = React.useState([]);
    const [showNotif, setShowNotif] = React.useState(false);
    const [messageNotifications, setMessageNotifications] = React.useState([]);
    const [showMessages, setShowMessages] = React.useState(false);
    const [unreadCount, setUnreadCount] = React.useState(0);

    // Fetch property notifications
    React.useEffect(() => {
        if (user) {
            api.get('/properties/notifications/me')
                .then(r => setNotifications(r.data.data.notifications || []))
                .catch(() => { });
        }
    }, [user, showNotif]);

    // Fetch message notifications and unread count
    React.useEffect(() => {
        if (user) {
            const fetchMessageNotifications = () => {
                api.get('/messages/unread-count')
                    .then(r => setUnreadCount(r.data.data.unreadCount || 0))
                    .catch(() => { });
                
                api.get('/messages/unread-messages')
                    .then(r => setMessageNotifications(r.data.data.messages || []))
                    .catch(() => { });
            };

            fetchMessageNotifications();
            const interval = setInterval(fetchMessageNotifications, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleMarkMessageAsRead = (senderId) => {
        api.patch(`/messages/mark-read/${senderId}`)
            .then(() => {
                setMessageNotifications(prev => prev.filter(m => m.sender._id !== senderId));
                setUnreadCount(prev => Math.max(0, prev - 1));
            })
            .catch(() => { });
    };

    const roleEmoji = { admin: '⚡', seller: '🏢', buyer: '🏡' };

    return (
        <nav className="navbar">
            <a href="/" className="nav-logo">
                <div className="logo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </div>
                <span>EstatePulse</span>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', fontWeight: '600', letterSpacing: '1px' }}>AI</span>
            </a>

            <div className="nav-links">
                {user && (
                    <>
                        <a
                            href={user.role === 'seller' ? '/seller' : user.role === 'admin' ? '/admin' : '/buyer'}
                            style={{ color: (location.pathname === '/seller' || location.pathname === '/buyer' || location.pathname === '/admin') ? '#60a5fa' : 'white', fontSize: '14px', fontWeight: '700', margin: '0 15px', textDecoration: 'none' }}
                        >
                            Dashboard
                        </a>
                        {user.isTeamMember && (
                            <a
                                href="/team-member-dashboard"
                                style={{ color: location.pathname === '/team-member-dashboard' ? '#60a5fa' : 'white', fontSize: '14px', fontWeight: '700', margin: '0 15px', textDecoration: 'none' }}
                            >
                                My Leads
                            </a>
                        )}
                    </>
                )}
                <a href="/messages" style={{ color: location.pathname === '/messages' ? '#60a5fa' : 'white', fontSize: '14px', fontWeight: '700', margin: '0 15px', textDecoration: 'none', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Messages
                    {unreadCount > 0 && (
                        <span style={{ 
                            position: 'absolute', 
                            top: '-8px', 
                            right: '-12px', 
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                            color: 'white', 
                            fontSize: '10px', 
                            fontWeight: '800', 
                            padding: '2px 6px', 
                            borderRadius: '10px',
                            minWidth: '18px',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
                            border: '2px solid #020817'
                        }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </a>
                {/* <a href="/profile" style={{ color: location.pathname === '/profile' ? '#60a5fa' : 'white', fontSize: '14px', fontWeight: '700', margin: '0 15px', textDecoration: 'none' }}>Profile</a> */}
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', marginRight: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{roleEmoji[user.role] || '👤'}</span>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', lineHeight: 1 }}>{user.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--accent-blue)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user.role}</div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => {
                        setShowMessages(!showMessages);
                        setShowNotif(false);
                    }}
                    style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '1px solid var(--border)', 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '10px', 
                        color: 'white', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        position: 'relative',
                        marginRight: '8px'
                    }}
                >
                    💬
                    {unreadCount > 0 && (
                        <span style={{ 
                            position: 'absolute', 
                            top: '-6px', 
                            right: '-6px', 
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                            color: 'white', 
                            fontSize: '10px', 
                            fontWeight: '800', 
                            padding: '2px 6px', 
                            borderRadius: '10px',
                            minWidth: '18px',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
                            border: '2px solid #020817'
                        }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {showMessages && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            style={{ 
                                position: 'absolute', 
                                top: '70px', 
                                right: '80px', 
                                width: '380px', 
                                background: 'rgba(13,21,38,0.95)', 
                                backdropFilter: 'blur(20px)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '20px', 
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)', 
                                zIndex: 100, 
                                padding: '20px',
                                maxHeight: '500px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div style={{ 
                                fontSize: '14px', 
                                fontWeight: '800', 
                                color: 'white', 
                                marginBottom: '16px', 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>MESSAGE NOTIFICATIONS</span>
                                {unreadCount > 0 && (
                                    <span style={{ 
                                        fontSize: '11px', 
                                        color: 'white',
                                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontWeight: '800'
                                    }}>
                                        {unreadCount} NEW
                                    </span>
                                )}
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '10px', 
                                overflowY: 'auto',
                                flex: 1
                            }} className="custom-scroll">
                                {messageNotifications.length > 0 ? messageNotifications.map((msg, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => {
                                            handleMarkMessageAsRead(msg.sender._id);
                                            navigate(`/messages?contactId=${msg.sender._id}${msg.propertyId ? `&propertyId=${msg.propertyId._id}` : ''}`);
                                            setShowMessages(false);
                                        }}
                                        style={{ 
                                            padding: '14px', 
                                            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.05))', 
                                            borderRadius: '14px', 
                                            border: '1px solid rgba(59,130,246,0.2)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))';
                                            e.currentTarget.style.transform = 'translateX(4px)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.05))';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{ 
                                                width: '36px', 
                                                height: '36px', 
                                                borderRadius: '10px', 
                                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                fontSize: '14px', 
                                                fontWeight: '800',
                                                flexShrink: 0
                                            }}>
                                                {msg.sender.name[0].toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    fontSize: '13px', 
                                                    fontWeight: '700', 
                                                    color: 'white',
                                                    marginBottom: '2px'
                                                }}>
                                                    {msg.sender.name}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '11px', 
                                                    color: '#64748b',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: '600'
                                                }}>
                                                    {msg.sender.role === 'seller' ? '🏢 Seller' : '👤 Buyer'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ 
                                            fontSize: '13px', 
                                            color: '#94a3b8', 
                                            lineHeight: '1.4',
                                            marginBottom: '8px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {msg.text}
                                        </div>
                                        {msg.propertyId && (
                                            <div style={{ 
                                                fontSize: '11px', 
                                                color: '#60a5fa',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                marginBottom: '6px'
                                            }}>
                                                <span>🏡</span> {msg.propertyId.title}
                                            </div>
                                        )}
                                        <div style={{ 
                                            fontSize: '10px', 
                                            color: '#475569',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkMessageAsRead(msg.sender._id);
                                                }}
                                                style={{
                                                    background: 'rgba(16,185,129,0.2)',
                                                    border: '1px solid rgba(16,185,129,0.3)',
                                                    color: '#10b981',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => {
                                                    e.target.style.background = 'rgba(16,185,129,0.3)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.target.style.background = 'rgba(16,185,129,0.2)';
                                                }}
                                            >
                                                Mark Read
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '40px 20px',
                                        color: '#475569',
                                        fontSize: '13px'
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>💬</div>
                                        <p style={{ fontWeight: '600', marginBottom: '4px' }}>No unread messages</p>
                                        <p style={{ fontSize: '11px' }}>You're all caught up!</p>
                                    </div>
                                )}
                            </div>
                            {messageNotifications.length > 0 && (
                                <button
                                    onClick={() => {
                                        navigate('/messages');
                                        setShowMessages(false);
                                    }}
                                    style={{
                                        marginTop: '12px',
                                        padding: '10px',
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                >
                                    View All Messages
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => {
                        setShowNotif(!showNotif);
                        setShowMessages(false);
                    }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', width: '36px', height: '36px', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                >
                    🔔
                    {notifications.some(n => !n.read) && (
                        <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid #020817' }} />
                    )}
                </button>

                <AnimatePresence>
                    {showNotif && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            style={{ position: 'absolute', top: '70px', right: '20px', width: '320px', background: 'rgba(13,21,38,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 100, padding: '20px' }}
                        >
                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'white', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                NOTIFICATIONS
                                <span style={{ fontSize: '10px', color: '#64748b' }}>{notifications.length} NEW</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }} className="custom-scroll">
                                {notifications.length > 0 ? notifications.map((n, i) => (
                                    <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: n.type === 'lead' ? '#f59e0b' : '#60a5fa', marginBottom: '4px' }}>{n.title}</div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>{n.message}</div>
                                        <div style={{ fontSize: '10px', color: '#475569', marginTop: '8px' }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: '12px' }}>No new notifications</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Sign Out
                </button>
            </div>
            
            <style>{`
                .custom-scroll::-webkit-scrollbar { 
                    width: 6px; 
                    height: 6px;
                }
                .custom-scroll::-webkit-scrollbar-track { 
                    background: rgba(255,255,255,0.03); 
                    borderRadius: 10px;
                }
                .custom-scroll::-webkit-scrollbar-thumb { 
                    background: linear-gradient(180deg, rgba(59,130,246,0.4), rgba(139,92,246,0.4)); 
                    borderRadius: 10px;
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover { 
                    background: linear-gradient(180deg, rgba(59,130,246,0.6), rgba(139,92,246,0.6)); 
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
