import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { ToastContainer } from '../components/Toast';
import leadTracker from '../services/leadTracking';

const Messages = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const contactId = searchParams.get('contactId');
    const propertyId = searchParams.get('propertyId');

    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [property, setProperty] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [agentMode, setAgentMode] = useState(false);
    const [agentTyping, setAgentTyping] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [toasts, setToasts] = useState([]);
    const scrollRef = useRef();
    const messagesEndRef = useRef(null);
    const lastMessageCountRef = useRef(0);

    const addToast = (message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, duration: 4000 }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Helper function to format time safely
    const formatTime = (timestamp) => {
        try {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    // Auto-scroll to bottom when messages change
    const scrollToBottom = () => {
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, agentTyping]);

    useEffect(() => {
        const initializeChat = async () => {
            try {
                // Fetch current user
                const userRes = await api.get('/users/me');
                const userData = userRes.data.data.user;
                setUser(userData);
                
                // Set session ID if property is present
                if (propertyId && userData) {
                    const sid = `${userData._id}_${propertyId}`;
                    setSessionId(sid);
                    console.log('[MESSAGES] Session ID set:', sid);
                }
                
                // Fetch property details if propertyId is present
                let propData = null;
                if (propertyId) {
                    const propRes = await api.get(`/properties/${propertyId}`);
                    propData = propRes.data.data.property;
                    setProperty(propData);
                    console.log('[MESSAGES] Property loaded:', propData.title);
                }
                
                // Fetch conversations
                const convsRes = await api.get('/messages/conversations');
                const convs = convsRes.data.data.conversations;
                setConversations(convs);

                // If contactId is present, find or create the conversation
                if (contactId) {
                    const conversationKey = propertyId ? `${contactId}_${propertyId}` : `${contactId}_general`;
                    const existing = convs.find(c => c.conversationId === conversationKey);
                    
                    if (existing) {
                        setSelectedConversation(existing);
                    } else {
                        // Fetch user details and create new conversation entry
                        const uRes = await api.get(`/users/${contactId}`);
                        const otherUser = uRes.data.data.user;
                        const newConv = {
                            user: otherUser,
                            property: propData, // Use the fetched property data
                            conversationId: conversationKey,
                            unreadCount: 0
                        };
                        setSelectedConversation(newConv);
                        setConversations([newConv, ...convs]);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('[MESSAGES] Initialization error:', err);
                setLoading(false);
            }
        };

        initializeChat();
    }, [contactId, propertyId]);

    useEffect(() => {
        if (selectedConversation && user) {
            const otherUserId = selectedConversation.user._id;
            const propId = selectedConversation.property?._id || 'general';
            
            api.get(`/messages/history/${otherUserId}?propertyId=${propId}`).then(res => {
                const newMessages = res.data.data.messages;
                setMessages(newMessages);
                lastMessageCountRef.current = newMessages.length;
                
                // Mark messages as read when viewing conversation
                api.patch(`/messages/mark-read/${otherUserId}?propertyId=${propId}`).catch(err => {
                    console.error('[MARK_READ] Error:', err);
                });
                
                // Send automated welcome message if this is a property chat with no messages
                if (selectedConversation.property && newMessages.length === 0) {
                    // Check if there's already an automated welcome message
                    const hasWelcome = newMessages.some(m => m.isAutomated);
                    
                    if (!hasWelcome) {
                        console.log('[MESSAGES] Sending automated welcome...');
                        // Send automated welcome message from seller
                        api.post('/messages/automated-welcome', {
                            sellerId: otherUserId,
                            buyerId: user._id,
                            propertyId: selectedConversation.property._id
                        }).then(welcomeRes => {
                            console.log('[MESSAGES] Automated welcome sent successfully');
                            setMessages(prev => [welcomeRes.data.data.message, ...prev]);
                        }).catch(err => {
                            console.error('[MESSAGES] Failed to send automated welcome:', err);
                        });
                    }
                }
            });
            
            const interval = setInterval(() => {
                api.get(`/messages/history/${otherUserId}?propertyId=${propId}`).then(res => {
                    const newMessages = res.data.data.messages;
                    setMessages(prevMessages => {
                        // Check if there are new messages
                        if (newMessages.length > lastMessageCountRef.current) {
                            // Show toast for new message
                            const latestMessage = newMessages[newMessages.length - 1];
                            if (latestMessage.sender !== user._id) {
                                addToast(latestMessage);
                            }
                            lastMessageCountRef.current = newMessages.length;
                            
                            // Mark as read automatically when viewing
                            api.patch(`/messages/mark-read/${otherUserId}?propertyId=${propId}`).catch(() => {});
                        }
                        return newMessages;
                    });
                });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedConversation, user]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageText = newMessage.trim();
        console.log('[SEND] Message text:', messageText);
        console.log('[SEND] Current messages count:', messages.length);
        console.log('[SEND] Agent mode:', agentMode);
        console.log('[SEND] Session ID:', sessionId);
        
        // Clear input immediately
        setNewMessage('');

        // Agent mode - send to AI agent
        if (agentMode && propertyId && sessionId) {
            console.log('[AGENT_MODE] Sending to agent...');
            
            const userMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: messageText,
                timestamp: Date.now(),
                isAgent: true
            };
            
            console.log('[AGENT_MODE] User message created:', userMessage);
            
            // Add user message to state
            setMessages(prevMessages => {
                const newMessages = [...prevMessages, userMessage];
                console.log('[STATE] Previous messages:', prevMessages.length);
                console.log('[STATE] New messages:', newMessages.length);
                console.log('[STATE] New messages array:', newMessages);
                return newMessages;
            });
            
            setAgentTyping(true);

            try {
                console.log('[API] Calling agent API...');
                const res = await api.post('/agent/chat', {
                    propertyId: propertyId,
                    query: messageText,
                    sessionId: sessionId
                });

                console.log('[API] Agent response received:', res.data);

                const agentMessage = {
                    id: `agent-${Date.now()}`,
                    role: 'agent',
                    content: res.data.data.response,
                    timestamp: Date.now(),
                    isAgent: true,
                    toolUsed: res.data.data.toolUsed
                };

                console.log('[AGENT_MODE] Agent message created:', agentMessage);

                setMessages(prevMessages => {
                    const newMessages = [...prevMessages, agentMessage];
                    console.log('[STATE] Adding agent response');
                    console.log('[STATE] Previous messages:', prevMessages.length);
                    console.log('[STATE] New messages:', newMessages.length);
                    console.log('[STATE] New messages array:', newMessages);
                    return newMessages;
                });
            } catch (err) {
                console.error('[AGENT_CHAT] Error:', err);
                const errorMessage = {
                    id: `error-${Date.now()}`,
                    role: 'agent',
                    content: "I apologize, but I'm having trouble processing your request. Please try again or switch to owner chat for direct assistance.",
                    timestamp: Date.now(),
                    isAgent: true,
                    error: true
                };
                setMessages(prevMessages => [...prevMessages, errorMessage]);
            } finally {
                setAgentTyping(false);
            }
            return;
        }

        // Regular message mode
        if (!selectedConversation) return;

        try {
            const res = await api.post('/messages', {
                receiverId: selectedConversation.user._id,
                propertyId: selectedConversation.property?._id || undefined,
                text: messageText
            });
            setMessages(prevMessages => [...prevMessages, res.data.data.message]);
            
            // Lead tracking is handled automatically in messageController.js
            // No need to call trackOwnerContact here
        } catch (err) {
            console.error('[OWNER_CHAT] Error:', err);
            alert('Failed to send message');
        }
    };

    if (loading) return null;

    const filteredConversations = conversations.filter(c => 
        c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.property?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ background: 'radial-gradient(ellipse at 10% 20%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(139,92,246,0.06) 0%, transparent 50%), #020817', minHeight: '100vh', color: 'white' }}>
            <Navbar user={user} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px 24px 24px' }}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '380px 1fr', 
                        height: 'calc(100vh - 180px)', 
                        gap: '24px',
                        background: 'rgba(13,21,38,0.6)',
                        borderRadius: '32px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Conversations Sidebar */}
                    <div style={{ 
                        borderRight: '1px solid rgba(255,255,255,0.08)', 
                        background: 'linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(2,6,23,0.9) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                    }}>
                        {/* Sidebar Header */}
                        <div style={{ padding: '32px 24px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Space Grotesk', background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Messages
                                </h2>
                                <div style={{ 
                                    padding: '8px 12px', 
                                    borderRadius: '12px', 
                                    background: 'rgba(59,130,246,0.1)', 
                                    border: '1px solid rgba(59,130,246,0.2)',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: '#60a5fa'
                                }}>
                                    {conversations.length} Active
                                </div>
                            </div>
                            
                            {/* Search Bar */}
                            <div style={{ position: 'relative' }}>
                                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#475569' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 42px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '14px',
                                        color: 'white',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.4)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        {/* Conversations List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }} className="custom-scroll">
                            <AnimatePresence>
                                {filteredConversations.length > 0 ? filteredConversations.map((conv, idx) => (
                                    <motion.div
                                        key={conv.conversationId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedConversation(conv)}
                                        style={{
                                            padding: '14px',
                                            borderRadius: '18px',
                                            background: selectedConversation?.conversationId === conv.conversationId 
                                                ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 100%)' 
                                                : 'transparent',
                                            border: '1px solid',
                                            borderColor: selectedConversation?.conversationId === conv.conversationId ? 'rgba(59,130,246,0.3)' : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                            transition: 'all 0.2s',
                                            marginBottom: '8px',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={e => {
                                            if (selectedConversation?.conversationId !== conv.conversationId) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (selectedConversation?.conversationId !== conv.conversationId) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        {/* User Info Row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                width: '44px', 
                                                height: '44px', 
                                                borderRadius: '12px', 
                                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                fontSize: '16px', 
                                                fontWeight: '800',
                                                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                                                position: 'relative',
                                                flexShrink: 0
                                            }}>
                                                {conv.user.name[0].toUpperCase()}
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    bottom: '-2px', 
                                                    right: '-2px', 
                                                    width: '12px', 
                                                    height: '12px', 
                                                    borderRadius: '50%', 
                                                    background: '#10b981',
                                                    border: '2px solid #0f172a',
                                                    boxShadow: '0 0 8px rgba(16,185,129,0.6)'
                                                }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginBottom: '2px' }}>{conv.user.name}</div>
                                                <div style={{ 
                                                    fontSize: '11px', 
                                                    color: '#64748b', 
                                                    textTransform: 'uppercase', 
                                                    letterSpacing: '0.5px',
                                                    fontWeight: '600'
                                                }}>
                                                    {conv.user.role === 'seller' ? '🏢 Seller' : '👤 Buyer'}
                                                </div>
                                            </div>
                                            {conv.unreadCount > 0 && (
                                                <div style={{ 
                                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                    color: 'white',
                                                    fontSize: '10px',
                                                    fontWeight: '800',
                                                    padding: '3px 7px',
                                                    borderRadius: '10px',
                                                    minWidth: '20px',
                                                    textAlign: 'center',
                                                    boxShadow: '0 2px 8px rgba(239,68,68,0.5)'
                                                }}>
                                                    {conv.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Property Info Row */}
                                        {conv.property && (
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                padding: '8px',
                                                background: 'rgba(59,130,246,0.08)',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(59,130,246,0.15)'
                                            }}>
                                                {conv.property.images && conv.property.images[0] && (
                                                    <img 
                                                        src={conv.property.images[0]} 
                                                        alt={conv.property.title}
                                                        style={{ 
                                                            width: '36px', 
                                                            height: '36px', 
                                                            borderRadius: '8px', 
                                                            objectFit: 'cover',
                                                            flexShrink: 0
                                                        }} 
                                                    />
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ 
                                                        fontSize: '12px', 
                                                        fontWeight: '600', 
                                                        color: '#60a5fa',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        🏡 {conv.property.title}
                                                    </div>
                                                    {conv.property.price && (
                                                        <div style={{ 
                                                            fontSize: '10px', 
                                                            color: '#94a3b8',
                                                            marginTop: '2px'
                                                        }}>
                                                            ₹{conv.property.price.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {selectedConversation?.conversationId === conv.conversationId && (
                                            <div style={{ 
                                                position: 'absolute',
                                                top: '14px',
                                                right: '14px',
                                                width: '8px', 
                                                height: '8px', 
                                                borderRadius: '50%', 
                                                background: '#3b82f6',
                                                boxShadow: '0 0 12px rgba(59,130,246,0.8)'
                                            }} />
                                        )}
                                    </motion.div>
                                )) : (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '60px 20px',
                                        color: '#475569',
                                        fontSize: '14px'
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>💬</div>
                                        <p style={{ fontWeight: '600' }}>No conversations yet</p>
                                        <p style={{ fontSize: '12px', marginTop: '8px' }}>Start chatting with property owners</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                {/* Chat Window */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    {agentMode && property ? (
                        <>
                            {/* AI Agent Chat Header */}
                            <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.05) 100%)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}>🤖</div>
                                    <div>
                                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>
                                            AI Property Assistant
                                            <span style={{ fontSize: '10px', marginLeft: '8px', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                                {messages.length} msgs
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                            Online & Ready to Help
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { 
                                        setAgentMode(false); 
                                        setMessages([]);
                                        // Reload owner chat messages if selectedUser exists
                                        if (selectedUser) {
                                            api.get(`/messages/history/${selectedUser._id}`).then(res => {
                                                setMessages(res.data.data.messages);
                                            }).catch(err => console.error('[SWITCH] Error loading messages:', err));
                                        }
                                    }} 
                                    style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '10px', 
                                        background: 'rgba(255,255,255,0.05)', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        color: '#94a3b8', 
                                        fontSize: '12px', 
                                        fontWeight: '600', 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        e.target.style.background = 'rgba(255,255,255,0.1)';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={e => {
                                        e.target.style.background = 'rgba(255,255,255,0.05)';
                                        e.target.style.color = '#94a3b8';
                                    }}
                                >
                                    Switch to Owner Chat
                                </button>
                            </div>

                            {/* AI Agent Messages */}
                            <div ref={scrollRef} style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }} className="custom-scroll">
                                {/* Property Summary Card */}
                                {property && messages.length === 0 && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.05) 100%)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '24px' }}>🏡</div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', fontFamily: 'Space Grotesk' }}>Ask Me Anything About This Property!</h3>
                                        </div>
                                        
                                        {property.images && property.images[0] && (
                                            <img src={property.images[0]} alt={property.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px' }} />
                                        )}
                                        
                                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>{property.title}</h4>
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', fontSize: '12px', color: '#60a5fa', fontWeight: '600' }}>
                                                ₹{property.price?.toLocaleString()}
                                            </span>
                                            {property.bedrooms && (
                                                <span style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '12px', color: '#6ee7b7', fontWeight: '600' }}>
                                                    {property.bedrooms} BHK
                                                </span>
                                            )}
                                            {property.area && (
                                                <span style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '12px', color: '#fcd34d', fontWeight: '600' }}>
                                                    {property.area} {property.areaUnit}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
                                            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '12px' }}>
                                                💡 <strong style={{ color: '#60a5fa' }}>Try asking me:</strong>
                                            </p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {['What is the price?', 'How far is the nearest metro?', 'What\'s the weather like?', 'Tell me about the owner'].map((q, i) => (
                                                    <button 
                                                        key={i} 
                                                        onClick={() => setNewMessage(q)} 
                                                        style={{ 
                                                            padding: '8px 12px', 
                                                            borderRadius: '8px', 
                                                            background: 'rgba(59,130,246,0.1)', 
                                                            border: '1px solid rgba(59,130,246,0.2)', 
                                                            color: '#60a5fa', 
                                                            fontSize: '12px', 
                                                            fontWeight: '600', 
                                                            cursor: 'pointer', 
                                                            textAlign: 'left', 
                                                            transition: 'all 0.2s' 
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.target.style.background = 'rgba(59,130,246,0.2)';
                                                            e.target.style.transform = 'translateX(4px)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.target.style.background = 'rgba(59,130,246,0.1)';
                                                            e.target.style.transform = 'translateX(0)';
                                                        }}
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                
                                {messages.length > 0 && messages.map((m, i) => {
                                    const isUser = m.role === 'user';
                                    const senderName = isUser ? 'You' : 'AI Assistant';
                                    
                                    return (
                                        <motion.div
                                            key={m.id || `msg-${i}-${m.timestamp}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                alignSelf: isUser ? 'flex-end' : 'flex-start',
                                                maxWidth: '75%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isUser ? 'flex-end' : 'flex-start',
                                                marginBottom: '12px'
                                            }}
                                        >
                                            {/* Sender Name Label */}
                                            <div style={{ 
                                                fontSize: '11px', 
                                                color: '#64748b', 
                                                marginBottom: '6px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '6px',
                                                fontWeight: '600',
                                                paddingLeft: isUser ? '0' : '4px',
                                                paddingRight: isUser ? '4px' : '0'
                                            }}>
                                                {!isUser && <span>🤖</span>}
                                                <span style={{ color: isUser ? '#60a5fa' : '#a78bfa' }}>
                                                    {senderName}
                                                </span>
                                                {m.toolUsed && (
                                                    <span style={{ 
                                                        padding: '2px 8px', 
                                                        borderRadius: '6px', 
                                                        background: m.toolUsed === 'property' ? 'rgba(59,130,246,0.15)' : m.toolUsed === 'maps' ? 'rgba(16,185,129,0.15)' : m.toolUsed === 'weather' ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)',
                                                        color: m.toolUsed === 'property' ? '#60a5fa' : m.toolUsed === 'maps' ? '#10b981' : m.toolUsed === 'weather' ? '#f59e0b' : '#a78bfa',
                                                        fontSize: '9px', 
                                                        fontWeight: '700',
                                                        border: '1px solid',
                                                        borderColor: m.toolUsed === 'property' ? 'rgba(59,130,246,0.3)' : m.toolUsed === 'maps' ? 'rgba(16,185,129,0.3)' : m.toolUsed === 'weather' ? 'rgba(245,158,11,0.3)' : 'rgba(139,92,246,0.3)'
                                                    }}>
                                                        {m.toolUsed === 'property' ? '📊 Database' : m.toolUsed === 'maps' ? '🗺️ Maps' : m.toolUsed === 'weather' ? '🌤️ Weather' : '💬 Chat'}
                                                    </span>
                                                )}
                                                {isUser && (
                                                    <div style={{ 
                                                        width: '20px', 
                                                        height: '20px', 
                                                        borderRadius: '6px', 
                                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        fontSize: '10px', 
                                                        fontWeight: '800',
                                                        color: 'white'
                                                    }}>
                                                        {user?.name?.[0]?.toUpperCase() || 'Y'}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Message Bubble */}
                                            <div style={{
                                                padding: '14px 18px',
                                                borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                background: isUser 
                                                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                                                    : m.error 
                                                        ? 'rgba(239,68,68,0.1)' 
                                                        : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
                                                color: 'white',
                                                fontSize: '14px',
                                                lineHeight: '1.6',
                                                border: isUser ? 'none' : m.error ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(139,92,246,0.2)',
                                                boxShadow: isUser ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                                                whiteSpace: 'pre-wrap',
                                                wordWrap: 'break-word'
                                            }}>
                                                {m.content}
                                            </div>
                                            
                                            {/* Timestamp */}
                                            <div style={{ 
                                                fontSize: '10px', 
                                                color: '#475569', 
                                                marginTop: '4px',
                                                paddingLeft: isUser ? '0' : '4px',
                                                paddingRight: isUser ? '4px' : '0'
                                            }}>
                                                {formatTime(m.timestamp)}
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {agentTyping && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                                        <div style={{ 
                                            fontSize: '11px', 
                                            color: '#64748b', 
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            paddingLeft: '4px'
                                        }}>
                                            <span>🤖</span> AI Assistant
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '16px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1.4s infinite ease-in-out' }} />
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: '600' }}>AI is thinking...</span>
                                        </div>
                                    </motion.div>
                                )}
                                
                                {/* Scroll anchor */}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* AI Agent Input */}
                            <form onSubmit={handleSendMessage} style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'rgba(2,6,23,0.5)' }}>
                                <div style={{ position: 'relative', display: 'flex', gap: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Ask me anything about this property..."
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        disabled={agentTyping}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px', padding: '14px 20px', color: 'white', fontSize: '14px', outline: 'none' }}
                                    />
                                    <button type="submit" disabled={agentTyping} style={{ padding: '0 28px', borderRadius: '16px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'transform 0.2s', opacity: agentTyping ? 0.5 : 1 }} onMouseEnter={e => !agentTyping && (e.target.style.transform = 'scale(1.02)')} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                                        {agentTyping ? '...' : 'Send'}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>{selectedConversation.user.name[0]}</div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '800' }}>{selectedConversation.user.name}</div>
                                        <div style={{ fontSize: '11px', color: '#10b981' }}>● Online</div>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div ref={scrollRef} style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }} className="custom-scroll">
                                {/* Property Summary Card - Show at top if property exists */}
                                {selectedConversation.property && (
                                    <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.05) 100%)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '24px' }}>🏡</div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', fontFamily: 'Space Grotesk' }}>Property Discussion</h3>
                                        </div>
                                        
                                        {selectedConversation.property.images && selectedConversation.property.images[0] && (
                                            <img src={selectedConversation.property.images[0]} alt={selectedConversation.property.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px' }} />
                                        )}
                                        
                                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>{selectedConversation.property.title}</h4>
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', fontSize: '12px', color: '#60a5fa', fontWeight: '600' }}>
                                                ₹{selectedConversation.property.price?.toLocaleString()}
                                            </span>
                                            {selectedConversation.property.bedrooms && (
                                                <span style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '12px', color: '#6ee7b7', fontWeight: '600' }}>
                                                    {selectedConversation.property.bedrooms} BHK
                                                </span>
                                            )}
                                            {selectedConversation.property.area && (
                                                <span style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '12px', color: '#fcd34d', fontWeight: '600' }}>
                                                    {selectedConversation.property.area} {selectedConversation.property.areaUnit}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '12px' }}>
                                            📍 {selectedConversation.property.location || selectedConversation.property.city}
                                        </p>
                                        {selectedConversation.property.aiBrokerSummary && (
                                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', marginTop: '12px' }}>
                                                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                                                    <strong style={{ color: '#60a5fa' }}>🤖 AI Summary:</strong> {selectedConversation.property.aiBrokerSummary.substring(0, 200)}...
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {messages.map((m, i) => {
                                    const isCurrentUser = m.sender === user?._id;
                                    const senderName = isCurrentUser ? 'You' : selectedConversation?.user?.name || 'Unknown';
                                    
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                                                maxWidth: '70%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                                                marginBottom: '8px'
                                            }}
                                        >
                                            {/* Sender Name Label */}
                                            <div style={{ 
                                                fontSize: '11px', 
                                                color: '#64748b', 
                                                marginBottom: '6px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                paddingLeft: isCurrentUser ? '0' : '4px',
                                                paddingRight: isCurrentUser ? '4px' : '0'
                                            }}>
                                                {!isCurrentUser && (
                                                    <div style={{ 
                                                        width: '20px', 
                                                        height: '20px', 
                                                        borderRadius: '6px', 
                                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        fontSize: '10px', 
                                                        fontWeight: '800',
                                                        color: 'white'
                                                    }}>
                                                        {senderName[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <span style={{ color: isCurrentUser ? '#60a5fa' : '#94a3b8' }}>
                                                    {senderName}
                                                </span>
                                                {m.isAutomated && (
                                                    <span style={{ 
                                                        fontSize: '9px', 
                                                        padding: '2px 6px', 
                                                        borderRadius: '4px', 
                                                        background: 'rgba(16,185,129,0.2)',
                                                        color: '#10b981',
                                                        border: '1px solid rgba(16,185,129,0.3)',
                                                        fontWeight: '700'
                                                    }}>
                                                        🤖 AUTO
                                                    </span>
                                                )}
                                                {isCurrentUser && (
                                                    <div style={{ 
                                                        width: '20px', 
                                                        height: '20px', 
                                                        borderRadius: '6px', 
                                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        fontSize: '10px', 
                                                        fontWeight: '800',
                                                        color: 'white'
                                                    }}>
                                                        {user?.name?.[0]?.toUpperCase() || 'Y'}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Message Bubble */}
                                            <div style={{
                                                padding: '14px 18px',
                                                borderRadius: isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                background: isCurrentUser 
                                                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                                                    : m.isAutomated 
                                                        ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))' 
                                                        : 'rgba(255,255,255,0.06)',
                                                color: 'white',
                                                fontSize: '14px',
                                                lineHeight: '1.6',
                                                border: isCurrentUser ? 'none' : m.isAutomated ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                                boxShadow: isCurrentUser ? '0 4px 12px rgba(59,130,246,0.3)' : m.isAutomated ? '0 4px 12px rgba(16,185,129,0.2)' : 'none',
                                                wordWrap: 'break-word',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {m.text}
                                            </div>
                                            
                                            {/* Timestamp */}
                                            <div style={{ 
                                                fontSize: '10px', 
                                                color: '#475569', 
                                                marginTop: '4px',
                                                paddingLeft: isCurrentUser ? '0' : '4px',
                                                paddingRight: isCurrentUser ? '4px' : '0'
                                            }}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Scroll anchor */}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'rgba(2,6,23,0.5)' }}>
                                <div style={{ position: 'relative', display: 'flex', gap: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px 20px', color: 'white', fontSize: '14px', outline: 'none' }}
                                    />
                                    <button type="submit" style={{ padding: '0 28px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'transform 0.2s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.02)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>Send</button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', opacity: 0.3 }}>
                            <div style={{ fontSize: '48px' }}>💬</div>
                            <p style={{ fontSize: '14px', fontWeight: '600' }}>Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
                </motion.div>
            </div>
            
            <style>{`
                .custom-scroll::-webkit-scrollbar { 
                    width: 8px; 
                    height: 8px;
                }
                .custom-scroll::-webkit-scrollbar-track { 
                    background: rgba(255,255,255,0.03); 
                    borderRadius: 10px;
                    margin: 4px;
                }
                .custom-scroll::-webkit-scrollbar-thumb { 
                    background: linear-gradient(180deg, rgba(59,130,246,0.4), rgba(139,92,246,0.4)); 
                    borderRadius: 10px;
                    border: 2px solid transparent;
                    backgroundClip: padding-box;
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover { 
                    background: linear-gradient(180deg, rgba(59,130,246,0.6), rgba(139,92,246,0.6)); 
                    borderRadius: 10px;
                    border: 2px solid transparent;
                    backgroundClip: padding-box;
                }
                
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Messages;
