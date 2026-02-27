import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { ToastContainer } from '../components/Toast';

const MessagesNew = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const contactId = searchParams.get('contactId');
    const propertyId = searchParams.get('propertyId');

    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [toasts, setToasts] = useState([]);
    const welcomeSentRef = useRef(new Set()); // Track welcome messages sent per conversation
    const messagesEndRef = useRef(null);
    const lastMessageCountRef = useRef(0);

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration: 4000 }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    // Initialize chat
    useEffect(() => {
        const initializeChat = async () => {
            try {
                setLoading(true);
                const userRes = await api.get('/users/me');
                const userData = userRes.data.data.user;
                setUser(userData);

                const convsRes = await api.get('/messages/conversations');
                const convs = convsRes.data.data.conversations || [];
                setConversations(convs);

                if (contactId) {
                    const conversationKey = propertyId ? `${contactId}_${propertyId}` : `${contactId}_general`;
                    const existing = convs.find(c => c.conversationId === conversationKey);

                    if (existing) {
                        setSelectedConversation(existing);
                        await loadMessages(contactId, propertyId);
                    } else {
                        try {
                            const uRes = await api.get(`/users/${contactId}`);
                            const contactUser = uRes.data.data.user;
                            let prop = null;
                            if (propertyId) {
                                const propRes = await api.get(`/properties/${propertyId}`);
                                prop = propRes.data.data.property;
                            }
                            const newConv = {
                                user: contactUser,
                                property: prop,
                                lastMessage: { text: 'Start a conversation', createdAt: new Date() },
                                unreadCount: 0,
                                conversationId: conversationKey
                            };
                            setSelectedConversation(newConv);
                            setConversations([newConv, ...convs]);
                            setMessages([]);
                        } catch (err) {
                            console.error('Error creating conversation:', err);
                            addToast('Failed to start conversation', 'error');
                        }
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('Initialization error:', err);
                setLoading(false);
                addToast('Failed to load messages', 'error');
            }
        };
        initializeChat();
    }, [contactId, propertyId]);

    // Load messages + send exactly one AI welcome
    useEffect(() => {
        if (!selectedConversation || !user) return;
        const otherUserId = selectedConversation.user._id;
        const propId = selectedConversation.property?._id;
        const conversationKey = selectedConversation.conversationId;

        const fetchMessages = async () => {
            try {
                const query = propId ? `?propertyId=${propId}` : '';
                const res = await api.get(`/messages/history/${otherUserId}${query}`);
                const msgs = res.data.data.messages || [];
                setMessages(msgs);
                lastMessageCountRef.current = msgs.length;

                // Mark as read
                api.patch(`/messages/mark-read/${otherUserId}${query}`).catch(() => { });

                // Send automated welcome ONLY ONCE per conversation
                if (propId && msgs.length === 0 && !welcomeSentRef.current.has(conversationKey)) {
                    welcomeSentRef.current.add(conversationKey); // Mark as sent BEFORE the API call
                    try {
                        const welcomeRes = await api.post('/messages/automated-welcome', {
                            sellerId: otherUserId,
                            buyerId: user._id,
                            propertyId: propId
                        });
                        setMessages(prev => [welcomeRes.data.data.message, ...prev]);
                        addToast('AI welcome message sent! 🤖', 'success');
                    } catch (err) {
                        console.error('Failed to send welcome:', err);
                    }
                }
            } catch (err) {
                console.error('Error loading messages:', err);
                setMessages([]);
            }
        };

        fetchMessages();

        // Polling
        const interval = setInterval(async () => {
            try {
                const query = propId ? `?propertyId=${propId}` : '';
                const res = await api.get(`/messages/history/${otherUserId}${query}`);
                const newMsgs = res.data.data.messages || [];
                if (newMsgs.length > lastMessageCountRef.current) {
                    const latest = newMsgs[newMsgs.length - 1];
                    if (latest.sender !== user._id) {
                        addToast(latest, 'info');
                    }
                    lastMessageCountRef.current = newMsgs.length;
                    api.patch(`/messages/mark-read/${otherUserId}${query}`).catch(() => { });
                }
                setMessages(newMsgs);
            } catch { }
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedConversation, user]);

    const loadMessages = async (otherUserId, propId) => {
        try {
            const query = propId ? `?propertyId=${propId}` : '';
            const res = await api.get(`/messages/history/${otherUserId}${query}`);
            setMessages(res.data.data.messages || []);
        } catch {
            setMessages([]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const text = newMessage.trim();
        setNewMessage('');

        try {
            const payload = {
                receiverId: selectedConversation.user._id,
                text,
                propertyId: selectedConversation.property?._id || null
            };
            await api.post('/messages', payload);
            await loadMessages(selectedConversation.user._id, selectedConversation.property?._id);
            const convsRes = await api.get('/messages/conversations');
            setConversations(convsRes.data.data.conversations || []);
            addToast('Message sent!', 'success');
        } catch (err) {
            console.error('Error sending message:', err);
            addToast('Failed to send message', 'error');
        }
    };

    const handleSelectConversation = async (conv) => {
        setSelectedConversation(conv);
        setSidebarOpen(false); // Close sidebar on mobile after selection
    };

    const filteredConversations = conversations.filter(c =>
        c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.property?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp) => {
        try {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    if (loading) {
        return (
            <div style={{ background: '#0a1628', minHeight: '100vh', color: 'white' }}>
                <Navbar user={user} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.15)', borderTopColor: '#3b82f6', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
                        <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>Loading messages...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#0a1628', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <Navbar user={user} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {/* ═══════════ SIDEBAR ═══════════ */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ x: -320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                width: '340px',
                                minWidth: '340px',
                                borderRight: '1px solid rgba(255,255,255,0.06)',
                                background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.98) 100%)',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                position: 'relative',
                                zIndex: 20,
                            }}
                        >
                            {/* Sidebar Header */}
                            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.05, x: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => navigate(-1)}
                                            style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
                                        >←</motion.button>
                                        <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Space Grotesk', background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                            Messages
                                        </h2>
                                    </div>
                                    <div style={{ padding: '5px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '11px', fontWeight: '700', color: '#60a5fa' }}>
                                        {conversations.length}
                                    </div>
                                </div>

                                {/* Search */}
                                <div style={{ position: 'relative' }}>
                                    <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#475569' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', fontSize: '13px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.4)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    />
                                </div>
                            </div>

                            {/* Conversations List */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }} className="custom-scroll">
                                {filteredConversations.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#475569' }}>
                                        <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>💬</div>
                                        <p style={{ fontWeight: '600', fontSize: '14px' }}>No conversations yet</p>
                                        <p style={{ fontSize: '12px', marginTop: '6px' }}>Start chatting with property owners</p>
                                    </div>
                                ) : (
                                    filteredConversations.map((conv, idx) => (
                                        <motion.div
                                            key={conv.conversationId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            whileHover={{ x: 3, background: 'rgba(255,255,255,0.04)' }}
                                            onClick={() => handleSelectConversation(conv)}
                                            style={{
                                                padding: '12px 14px',
                                                borderRadius: '14px',
                                                background: selectedConversation?.conversationId === conv.conversationId
                                                    ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))'
                                                    : 'transparent',
                                                border: selectedConversation?.conversationId === conv.conversationId
                                                    ? '1px solid rgba(59,130,246,0.25)'
                                                    : '1px solid transparent',
                                                cursor: 'pointer',
                                                marginBottom: '4px',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '15px', fontWeight: '800', flexShrink: 0,
                                                    boxShadow: '0 3px 10px rgba(59,130,246,0.25)',
                                                    position: 'relative'
                                                }}>
                                                    {conv.user.name[0].toUpperCase()}
                                                    <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a' }} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {conv.user.name}
                                                        </span>
                                                        {conv.unreadCount > 0 && (
                                                            <span style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '8px', minWidth: '16px', textAlign: 'center', flexShrink: 0 }}>
                                                                {conv.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {conv.property && (
                                                        <div style={{ fontSize: '11px', color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span>🏡</span> {conv.property.title}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {conv.lastMessage?.text || 'No messages yet'}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sidebar Toggle Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    style={{
                        position: 'absolute',
                        left: sidebarOpen ? '340px' : '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 30,
                        width: '28px',
                        height: '56px',
                        borderRadius: sidebarOpen ? '0 12px 12px 0' : '0 12px 12px 0',
                        background: 'rgba(59,130,246,0.15)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        borderLeft: 'none',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        transition: 'left 0.3s ease',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {sidebarOpen ? '◀' : '▶'}
                </motion.button>

                {/* ═══════════ CHAT AREA ═══════════ */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'radial-gradient(ellipse at 60% 30%, rgba(59,130,246,0.04) 0%, transparent 70%), #0a1628' }}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div style={{
                                padding: '14px 24px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: 'rgba(15,23,42,0.6)',
                                backdropFilter: 'blur(20px)',
                                flexShrink: 0,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '16px', fontWeight: '800',
                                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                                    }}>
                                        {selectedConversation.user.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>
                                            {selectedConversation.user.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                                            Online
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Property Context Bar */}
                            {selectedConversation.property && (
                                <div style={{
                                    padding: '10px 24px',
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    flexShrink: 0,
                                }}>
                                    {selectedConversation.property.images?.[0] && (
                                        <img src={selectedConversation.property.images[0]} alt="" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedConversation.property.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '700' }}>
                                            ₹{selectedConversation.property.price?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Messages Area */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="custom-scroll">
                                {messages.length === 0 ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ textAlign: 'center', color: '#475569' }}>
                                            <div style={{ fontSize: '44px', marginBottom: '12px', opacity: 0.3 }}>💬</div>
                                            <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>No messages yet</p>
                                            <p style={{ fontSize: '12px' }}>Start the conversation!</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isOwn = msg.sender?.toString() === user._id;
                                        return (
                                            <motion.div
                                                key={msg._id || idx}
                                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ type: 'spring', damping: 25 }}
                                                style={{
                                                    display: 'flex',
                                                    gap: '8px',
                                                    flexDirection: isOwn ? 'row-reverse' : 'row',
                                                    alignItems: 'flex-end',
                                                }}
                                            >
                                                {/* Avatar */}
                                                <div style={{
                                                    width: '30px', height: '30px', borderRadius: '10px',
                                                    background: isOwn ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '11px', fontWeight: '800', flexShrink: 0, color: 'white',
                                                }}>
                                                    {isOwn ? user.name[0].toUpperCase() : selectedConversation.user.name[0].toUpperCase()}
                                                </div>

                                                {/* Bubble */}
                                                <div style={{
                                                    maxWidth: '65%',
                                                    padding: '12px 16px',
                                                    borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                    background: isOwn
                                                        ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                                                        : 'rgba(255,255,255,0.05)',
                                                    border: isOwn ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                                    boxShadow: isOwn ? '0 4px 14px rgba(59,130,246,0.25)' : 'none',
                                                }}>
                                                    <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'white', wordBreak: 'break-word', margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                                    <p style={{ fontSize: '10px', color: isOwn ? 'rgba(255,255,255,0.6)' : '#475569', marginTop: '6px', textAlign: isOwn ? 'right' : 'left' }}>
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSendMessage} style={{
                                padding: '16px 24px',
                                borderTop: '1px solid rgba(255,255,255,0.06)',
                                background: 'rgba(15,23,42,0.6)',
                                backdropFilter: 'blur(20px)',
                                flexShrink: 0,
                            }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        style={{
                                            flex: 1, padding: '12px 18px',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '14px', color: 'white',
                                            fontSize: '14px', outline: 'none',
                                            transition: 'all 0.2s',
                                            fontFamily: 'Inter',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.4)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            background: newMessage.trim()
                                                ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                                                : 'rgba(255,255,255,0.04)',
                                            border: 'none', color: 'white', cursor: newMessage.trim() ? 'pointer' : 'default',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s',
                                            boxShadow: newMessage.trim() ? '0 4px 14px rgba(59,130,246,0.3)' : 'none',
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                    </motion.button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', damping: 20 }}
                                style={{ textAlign: 'center' }}
                            >
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '24px',
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                                    border: '1px solid rgba(59,130,246,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 20px', fontSize: '36px',
                                }}>💬</div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '8px', fontFamily: 'Space Grotesk' }}>Select a Conversation</h3>
                                <p style={{ color: '#64748b', fontSize: '14px' }}>Choose from your conversations to start messaging</p>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagesNew;
