import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Navbar from '../components/Navbar';

const AgentChat = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const propertyId = searchParams.get('propertyId');

    const [user, setUser] = useState(null);
    const [property, setProperty] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Load user and property
    useEffect(() => {
        const loadData = async () => {
            try {
                const userRes = await api.get('/users/me');
                const userData = userRes.data.data.user;
                setUser(userData);
                
                if (propertyId) {
                    const propRes = await api.get(`/properties/${propertyId}`);
                    setProperty(propRes.data.data.property);
                    setSessionId(`${userData._id}_${propertyId}`);
                }
            } catch (err) {
                console.error('Error loading data:', err);
            }
        };
        loadData();
    }, [propertyId]);

    // Send message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !sessionId) return;

        const userMsg = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/agent/chat', {
                propertyId,
                query: userMsg.content,
                sessionId
            });

            const agentMsg = {
                id: `agent-${Date.now()}`,
                role: 'agent',
                content: res.data.data.response,
                timestamp: Date.now(),
                toolUsed: res.data.data.toolUsed
            };

            setMessages(prev => [...prev, agentMsg]);
        } catch (err) {
            console.error('Error:', err);
            const errorMsg = {
                id: `error-${Date.now()}`,
                role: 'agent',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: Date.now(),
                error: true
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    // Suggested questions
    const suggestions = [
        "What's the price?",
        "How far is the nearest metro?",
        "What's the weather like?",
        "Tell me about nearby schools"
    ];

    if (!property) {
        return (
            <div style={{ background: '#0a0f1e', minHeight: '100vh', color: 'white' }}>
                <Navbar user={user} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏡</div>
                        <p>Loading property...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#0a0f1e', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <Navbar user={user} />
            
            {/* Main Container */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '20px' }}>
                
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '20px',
                        border: '1px solid rgba(99,102,241,0.2)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ 
                            width: '60px', 
                            height: '60px', 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px',
                            boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
                        }}>
                            🤖
                        </div>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, marginBottom: '4px' }}>
                                AI Property Assistant
                            </h1>
                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                                Ask me anything about {property.title}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(`/messages?contactId=${property.seller._id}&propertyId=${propertyId}`)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
                            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            💬 Chat with Owner
                        </button>
                    </div>

                    {/* Property Info */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ 
                            padding: '6px 14px', 
                            borderRadius: '10px', 
                            background: 'rgba(59,130,246,0.2)', 
                            border: '1px solid rgba(59,130,246,0.3)',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#60a5fa'
                        }}>
                            💰 ₹{property.price?.toLocaleString()}
                        </span>
                        {property.bedrooms && (
                            <span style={{ 
                                padding: '6px 14px', 
                                borderRadius: '10px', 
                                background: 'rgba(16,185,129,0.2)', 
                                border: '1px solid rgba(16,185,129,0.3)',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#6ee7b7'
                            }}>
                                🛏️ {property.bedrooms} BHK
                            </span>
                        )}
                        {property.area && (
                            <span style={{ 
                                padding: '6px 14px', 
                                borderRadius: '10px', 
                                background: 'rgba(245,158,11,0.2)', 
                                border: '1px solid rgba(245,158,11,0.3)',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#fcd34d'
                            }}>
                                📐 {property.area} {property.areaUnit}
                            </span>
                        )}
                        <span style={{ 
                            padding: '6px 14px', 
                            borderRadius: '10px', 
                            background: 'rgba(168,85,247,0.2)', 
                            border: '1px solid rgba(168,85,247,0.3)',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#c084fc'
                        }}>
                            📍 {property.city || property.location}
                        </span>
                    </div>
                </motion.div>

                {/* Messages Area */}
                <div style={{ 
                    flex: 1, 
                    background: 'rgba(15,23,42,0.6)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    marginBottom: '20px'
                }}>
                    
                    {/* Messages List */}
                    <div style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        {messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '40px 20px' }}
                            >
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>👋</div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                                    Hi! I'm your AI assistant
                                </h3>
                                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                                    Ask me anything about this property
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
                                    {suggestions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(q)}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                background: 'rgba(99,102,241,0.1)',
                                                border: '1px solid rgba(99,102,241,0.2)',
                                                color: '#a5b4fc',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => {
                                                e.target.style.background = 'rgba(99,102,241,0.2)';
                                                e.target.style.transform = 'translateX(4px)';
                                            }}
                                            onMouseLeave={e => {
                                                e.target.style.background = 'rgba(99,102,241,0.1)';
                                                e.target.style.transform = 'translateX(0)';
                                            }}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div style={{ maxWidth: '70%' }}>
                                        {msg.role === 'agent' && (
                                            <div style={{ 
                                                fontSize: '11px', 
                                                color: '#64748b', 
                                                marginBottom: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <span>🤖 AI Assistant</span>
                                                {msg.toolUsed && (
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        background: msg.toolUsed === 'property' ? 'rgba(59,130,246,0.2)' : msg.toolUsed === 'maps' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                                                        color: msg.toolUsed === 'property' ? '#60a5fa' : msg.toolUsed === 'maps' ? '#10b981' : '#f59e0b',
                                                        fontSize: '10px',
                                                        fontWeight: '700'
                                                    }}>
                                                        {msg.toolUsed === 'property' ? '📊' : msg.toolUsed === 'maps' ? '🗺️' : '🌤️'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div style={{
                                            padding: '14px 18px',
                                            borderRadius: '16px',
                                            background: msg.role === 'user' 
                                                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                                : msg.error
                                                    ? 'rgba(239,68,68,0.2)'
                                                    : 'rgba(30,41,59,0.8)',
                                            border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            boxShadow: msg.role === 'user' ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
                                            {msg.content}
                                        </div>
                                        <div style={{ 
                                            fontSize: '10px', 
                                            color: '#475569', 
                                            marginTop: '4px',
                                            textAlign: msg.role === 'user' ? 'right' : 'left'
                                        }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ display: 'flex', justifyContent: 'flex-start' }}
                            >
                                <div style={{
                                    padding: '14px 18px',
                                    borderRadius: '16px',
                                    background: 'rgba(30,41,59,0.8)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'bounce 1.4s infinite ease-in-out' }} />
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Thinking...</span>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} style={{ 
                        padding: '20px 24px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(2,6,23,0.8)'
                    }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask me anything about this property..."
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                style={{
                                    padding: '14px 28px',
                                    borderRadius: '14px',
                                    background: loading || !input.trim() ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: loading || !input.trim() ? 'none' : '0 4px 16px rgba(99,102,241,0.4)'
                                }}
                                onMouseEnter={e => {
                                    if (!loading && input.trim()) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = loading || !input.trim() ? 'none' : '0 4px 16px rgba(99,102,241,0.4)';
                                }}
                            >
                                {loading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AgentChat;
