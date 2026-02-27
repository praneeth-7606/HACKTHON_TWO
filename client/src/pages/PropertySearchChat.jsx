import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

// Property Card Component (same style as BuyerDiscovery)
const PropertyCard = ({ property, index, onClick }) => {
    const [imageIndex, setImageIndex] = useState(0);
    const hasImages = property.images && property.images.length > 0;

    const priceAbbr = (n) => {
        if (!n) return '—';
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
        return `₹${n.toLocaleString()}`;
    };

    const GRADIENTS = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];

    const STATUS_COLOR = {
        'Sale': '#10b981',
        'Rent': '#3b82f6',
        'Lease': '#f59e0b'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            style={{
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'rgba(13,21,38,0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer',
                transition: 'all 0.3s'
            }}
            whileHover={{
                y: -8,
                boxShadow: '0 28px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,179,237,0.25)'
            }}
        >
            {/* Image Section */}
            <div style={{ position: 'relative', height: '220px', background: GRADIENTS[index % GRADIENTS.length] }}>
                {hasImages ? (
                    <img
                        src={property.images[imageIndex]}
                        alt={property.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}
                    />
                ) : (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '52px' }}>
                        🏡
                    </div>
                )}

                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,8,23,0.95) 0%, rgba(2,8,23,0.2) 55%, transparent 100%)' }} />

                {/* Listing Type Badge */}
                <div style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: `${STATUS_COLOR[property.listingType] || '#3b82f6'}28`,
                    border: `1px solid ${STATUS_COLOR[property.listingType] || '#3b82f6'}60`,
                    fontSize: '10px',
                    fontWeight: '800',
                    color: STATUS_COLOR[property.listingType] || '#60a5fa',
                    letterSpacing: '1px'
                }}>
                    FOR {property.listingType?.toUpperCase() || 'SALE'}
                </div>

                {/* Price */}
                <div style={{
                    position: 'absolute',
                    bottom: '14px',
                    right: '14px',
                    fontFamily: 'Space Grotesk',
                    fontWeight: '800',
                    fontSize: '22px',
                    color: 'white',
                    textShadow: '0 2px 10px rgba(0,0,0,0.9)'
                }}>
                    {priceAbbr(property.price)}
                </div>

                {/* Seller Info */}
                <div style={{ position: 'absolute', bottom: '14px', left: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'white',
                        border: '1.5px solid rgba(255,255,255,0.3)'
                    }}>
                        {property.seller?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>
                        {property.seller?.name || 'Agent'}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div style={{ padding: '20px 22px 22px' }}>
                <h3 style={{
                    fontFamily: 'Space Grotesk',
                    fontWeight: '700',
                    fontSize: '17px',
                    color: 'white',
                    marginBottom: '6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {property.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '13px', marginBottom: '14px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    {property.location || property.city || '—'}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {property.bedrooms && (
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: 'rgba(59,130,246,0.1)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            fontSize: '12px',
                            color: '#93c5fd',
                            fontWeight: '600'
                        }}>
                            🛏 {property.bedrooms}
                        </span>
                    )}
                    {property.area && (
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            fontSize: '12px',
                            color: '#fcd34d',
                            fontWeight: '600'
                        }}>
                            📐 {property.area}
                        </span>
                    )}
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '12px',
                        color: '#94a3b8',
                        fontWeight: '600'
                    }}>
                        💬 {property.comments?.length || 0}
                    </span>
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '12px',
                        color: '#94a3b8',
                        fontWeight: '600'
                    }}>
                        ❤️ {property.likes?.length || 0}
                    </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>VIEW DETAILS</span>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'rgba(59,130,246,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Main Component
const PropertySearchChat = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    const [error, setError] = useState(null);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        api.get('/users/me')
            .then(res => {
                const userData = res.data.data.user;
                setUser(userData);

                // Redirect sellers to their dashboard
                if (userData.role === 'seller') {
                    navigate('/seller');
                }
            })
            .catch(() => navigate('/auth'));
    }, [navigate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [searchResults]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const res = await api.post('/search/properties', { query: input });
            setSearchResults(res.data.data);
        } catch (err) {
            console.error('Search error:', err);
            setError(err.response?.data?.message || 'Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const suggestedQueries = [
        "2 BHK in Marathahalli under 70 lakhs",
        "3 bedroom villa in Whitefield for rent",
        "Commercial plot in Bangalore 1 crore",
        "Apartment for sale in Koramangala"
    ];

    if (!user) {
        return (
            <div style={{ background: '#0a1628', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏡</div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#0a1628', minHeight: '100vh', color: 'white' }}>
            <Navbar user={user} />

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: '48px' }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 20px',
                        borderRadius: '999px',
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        marginBottom: '24px'
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981', animation: 'pulse 2s ease-in-out infinite' }} />
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#60a5fa' }}>AI-Powered Property Search</span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(32px, 5vw, 56px)',
                        fontWeight: '900',
                        lineHeight: 1.1,
                        marginBottom: '16px',
                        fontFamily: 'Space Grotesk'
                    }}>
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Find Your Dream Property
                        </span>
                    </h1>

                    <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
                        Just describe what you're looking for in natural language, and our AI will find the perfect matches
                    </p>
                </motion.div>

                {/* Search Box */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ maxWidth: '800px', margin: '0 auto 48px' }}
                >
                    <form onSubmit={handleSearch} style={{
                        background: 'rgba(15,23,42,0.6)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '24px',
                        backdropFilter: 'blur(20px)'
                    }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="e.g., 2 BHK in Marathahalli under 70 lakhs"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '16px 20px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                style={{
                                    padding: '16px 32px',
                                    borderRadius: '16px',
                                    background: loading || !input.trim() ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                    boxShadow: loading || !input.trim() ? 'none' : '0 8px 24px rgba(59,130,246,0.4)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? '🔍 Searching...' : '🔍 Search'}
                            </button>
                        </div>

                        {/* Suggested Queries */}
                        {!searchResults && (
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', fontWeight: '600' }}>
                                    Try these examples:
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {suggestedQueries.map((query, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setInput(query)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '12px',
                                                background: 'rgba(59,130,246,0.1)',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                                color: '#93c5fd',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.target.style.background = 'rgba(59,130,246,0.2)'}
                                            onMouseLeave={e => e.target.style.background = 'rgba(59,130,246,0.1)'}
                                        >
                                            {query}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            maxWidth: '800px',
                            margin: '0 auto 32px',
                            padding: '16px 24px',
                            borderRadius: '16px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#fca5a5',
                            textAlign: 'center'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                {/* Search Results */}
                {searchResults && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Results Header */}
                        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', fontFamily: 'Space Grotesk' }}>
                                Found {searchResults.count} {searchResults.count === 1 ? 'Property' : 'Properties'}
                            </h2>
                            <p style={{ fontSize: '14px', color: '#64748b' }}>
                                Showing results for: <span style={{ color: '#60a5fa', fontWeight: '600' }}>"{searchResults.query}"</span>
                            </p>

                            {/* Applied Filters */}
                            {searchResults.filters && (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                                    {searchResults.filters.bedrooms && (
                                        <span style={{
                                            padding: '6px 14px',
                                            borderRadius: '10px',
                                            background: 'rgba(59,130,246,0.1)',
                                            border: '1px solid rgba(59,130,246,0.2)',
                                            fontSize: '12px',
                                            color: '#93c5fd',
                                            fontWeight: '600'
                                        }}>
                                            🛏 {searchResults.filters.bedrooms} BHK
                                        </span>
                                    )}
                                    {searchResults.filters.location && (
                                        <span style={{
                                            padding: '6px 14px',
                                            borderRadius: '10px',
                                            background: 'rgba(16,185,129,0.1)',
                                            border: '1px solid rgba(16,185,129,0.2)',
                                            fontSize: '12px',
                                            color: '#6ee7b7',
                                            fontWeight: '600'
                                        }}>
                                            📍 {searchResults.filters.location}
                                        </span>
                                    )}
                                    {(searchResults.filters.minPrice || searchResults.filters.maxPrice) && (
                                        <span style={{
                                            padding: '6px 14px',
                                            borderRadius: '10px',
                                            background: 'rgba(245,158,11,0.1)',
                                            border: '1px solid rgba(245,158,11,0.2)',
                                            fontSize: '12px',
                                            color: '#fcd34d',
                                            fontWeight: '600'
                                        }}>
                                            💰 {searchResults.filters.minPrice ? `₹${(searchResults.filters.minPrice / 100000).toFixed(0)}L` : ''}
                                            {searchResults.filters.minPrice && searchResults.filters.maxPrice ? ' - ' : ''}
                                            {searchResults.filters.maxPrice ? `₹${(searchResults.filters.maxPrice / 100000).toFixed(0)}L` : ''}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Property Grid */}
                        {searchResults.properties.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                {searchResults.properties.map((property, index) => (
                                    <PropertyCard
                                        key={property._id}
                                        property={property}
                                        index={index}
                                        onClick={() => setSelectedProperty(property)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '80px 20px',
                                background: 'rgba(15,23,42,0.6)',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
                                <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>No properties found</h3>
                                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                                    Try adjusting your search criteria or browse all properties
                                </p>
                                <button
                                    onClick={() => navigate('/buyer')}
                                    style={{
                                        padding: '12px 28px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 24px rgba(59,130,246,0.4)'
                                    }}
                                >
                                    Browse All Properties
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Property Detail Modal */}
            {selectedProperty && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10000,
                    background: '#0a1628',
                    overflow: 'auto'
                }}>
                    <div style={{
                        padding: '20px 40px',
                        background: 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        backdropFilter: 'blur(20px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button
                                onClick={() => setSelectedProperty(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ←
                            </button>
                            <div>
                                <h2 style={{
                                    fontFamily: 'Space Grotesk',
                                    fontSize: '24px',
                                    fontWeight: '800',
                                    color: 'white'
                                }}>
                                    {selectedProperty.title}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '700' }}>
                                        {selectedProperty.listingType?.toUpperCase()}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                        {selectedProperty.location}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(`/agent-chat?propertyId=${selectedProperty._id}`)}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                color: 'white',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
                            }}
                        >
                            🤖 Ask AI About This
                        </button>
                    </div>

                    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '24px',
                            padding: '32px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            marginBottom: '32px'
                        }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>
                                Property Details
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Price</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#60a5fa' }}>
                                        ₹{selectedProperty.price >= 10000000 ?
                                            `${(selectedProperty.price / 10000000).toFixed(1)} Cr` :
                                            `${(selectedProperty.price / 100000).toFixed(1)} L`}
                                    </div>
                                </div>
                                {selectedProperty.bedrooms && (
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Bedrooms</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800' }}>{selectedProperty.bedrooms} BHK</div>
                                    </div>
                                )}
                                {selectedProperty.area && (
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Area</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800' }}>{selectedProperty.area} {selectedProperty.areaUnit}</div>
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Type</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800' }}>{selectedProperty.propertyType}</div>
                                </div>
                            </div>
                        </div>

                        {selectedProperty.description && (
                            <div style={{
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '24px',
                                padding: '32px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                marginBottom: '32px'
                            }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>
                                    Description
                                </h3>
                                <p style={{ color: '#94a3b8', lineHeight: '1.7' }}>
                                    {selectedProperty.description}
                                </p>
                            </div>
                        )}

                        <div style={{
                            background: 'rgba(59,130,246,0.05)',
                            borderRadius: '24px',
                            padding: '32px',
                            border: '1px solid rgba(59,130,246,0.1)',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>
                                Want to see full details?
                            </h3>
                            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                                Go to the buyer dashboard to view complete property information, images, and interact with the seller
                            </p>
                            <button
                                onClick={() => navigate(`/buyer?propertyId=${selectedProperty._id}`)}
                                style={{
                                    padding: '14px 32px',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 24px rgba(59,130,246,0.4)'
                                }}
                            >
                                Get the complete details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default PropertySearchChat;
