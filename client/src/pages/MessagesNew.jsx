import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Search, MessageCircle, Home, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

const MessagesNew = () => {
    const [searchParams] = useSearchParams();
    const contactId = searchParams.get('contactId');
    const propertyId = searchParams.get('propertyId');

    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                            const userRes = await api.get(`/users/${contactId}`);
                            const contactUser = userRes.data.data.user;
                            
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
                        }
                    }
                }
                
                setLoading(false);
            } catch (err) {
                console.error('Initialization error:', err);
                setLoading(false);
            }
        };

        initializeChat();
    }, [contactId, propertyId]);

    const loadMessages = async (otherUserId, propId) => {
        try {
            const query = propId ? `?propertyId=${propId}` : '';
            const res = await api.get(`/messages/history/${otherUserId}${query}`);
            const msgs = res.data.data.messages || [];
            setMessages(msgs);
        } catch (err) {
            console.error('Error loading messages:', err);
            setMessages([]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const payload = {
                receiverId: selectedConversation.user._id,
                text: newMessage,
                propertyId: selectedConversation.property?._id || null
            };

            await api.post('/messages/send', payload);
            setNewMessage('');
            await loadMessages(selectedConversation.user._id, selectedConversation.property?._id);
            
            const convsRes = await api.get('/messages/conversations');
            setConversations(convsRes.data.data.conversations || []);
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleSelectConversation = async (conv) => {
        setSelectedConversation(conv);
        await loadMessages(conv.user._id, conv.property?._id);
    };

    const filteredConversations = conversations.filter(c =>
        c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <Navbar user={user} />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-white">Loading messages...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <Navbar user={user} />
            
            <div className="h-[calc(100vh-80px)] flex gap-0">
                {/* Sidebar - Always visible on desktop, hidden on mobile when chat selected */}
                <div className={cn(
                    "w-full md:w-96 border-r border-slate-800 bg-slate-900/50 flex flex-col transition-all",
                    selectedConversation && "hidden md:flex"
                )}>
                    <div className="p-4 border-b border-slate-800">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-blue-500" />
                            Messages
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-2 space-y-2">
                            {filteredConversations.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No conversations yet</p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => (
                                    <motion.button
                                        key={conv.conversationId}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={cn(
                                            "w-full p-3 rounded-lg text-left transition-all text-sm",
                                            selectedConversation?.conversationId === conv.conversationId
                                                ? "bg-gradient-to-r from-blue-600/40 to-purple-600/40 border border-blue-500/60"
                                                : "hover:bg-slate-800/50 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar className="w-10 h-10 flex-shrink-0">
                                                <AvatarFallback className="text-xs font-bold">
                                                    {conv.user.name[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-white truncate text-sm">
                                                        {conv.user.name}
                                                    </h3>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                                                            {conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                {conv.property && (
                                                    <p className="text-xs text-blue-400 mb-1 truncate flex items-center gap-1">
                                                        <Home className="w-3 h-3 flex-shrink-0" />
                                                        {conv.property.title}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-400 truncate line-clamp-2">
                                                    {conv.lastMessage?.text || 'No messages'}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className={cn(
                    "flex-1 flex flex-col bg-slate-900/30",
                    !selectedConversation && "hidden md:flex"
                )}>
                    {selectedConversation ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setSelectedConversation(null)}
                                        className="md:hidden text-white hover:bg-slate-800 p-2 rounded-lg transition"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <Avatar className="w-10 h-10">
                                        <AvatarFallback className="font-bold">
                                            {selectedConversation.user.name[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-white">
                                            {selectedConversation.user.name}
                                        </h3>
                                        <p className="text-xs text-green-400 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                            Online
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Property Info */}
                            {selectedConversation.property && (
                                <div className="p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-slate-800">
                                    <div className="flex items-center gap-3">
                                        {selectedConversation.property.images?.[0] && (
                                            <img
                                                src={selectedConversation.property.images[0]}
                                                alt={selectedConversation.property.title}
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white text-sm line-clamp-2">
                                                {selectedConversation.property.title}
                                            </h4>
                                            <p className="text-blue-400 font-bold text-sm">
                                                ₹{selectedConversation.property.price?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-slate-500">
                                            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">No messages yet. Start the conversation!</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isOwn = msg.sender.toString() === user._id;
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "flex gap-3",
                                                    isOwn ? "flex-row-reverse" : "flex-row"
                                                )}
                                            >
                                                <Avatar className="w-8 h-8 flex-shrink-0">
                                                    <AvatarFallback className="text-xs font-bold">
                                                        {isOwn ? user.name[0].toUpperCase() : selectedConversation.user.name[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={cn(
                                                    "max-w-sm rounded-2xl px-4 py-2",
                                                    isOwn
                                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                                        : "bg-slate-800 text-white"
                                                )}>
                                                    <p className="text-sm break-words">{msg.text}</p>
                                                    <p className={cn(
                                                        "text-xs mt-1",
                                                        isOwn ? "text-blue-100" : "text-slate-400"
                                                    )}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/50">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="hidden md:flex flex-1 items-center justify-center">
                            <div className="text-center">
                                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                                <h3 className="text-xl font-bold text-white mb-2">No conversation selected</h3>
                                <p className="text-slate-400">Choose a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagesNew;
