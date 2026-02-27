import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import leadTracker from '../services/leadTracking';

// ─── IMAGE CAROUSEL PER CARD ──────────────────────────────────────────────────
const ImageCarousel = ({ images, fallbackGradient, height = '220px' }) => {
    const [idx, setIdx] = useState(0);
    const hasImages = images && images.length > 0;

    const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };
    const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); };

    return (
        <div style={{ position: 'relative', height, overflow: 'hidden', background: fallbackGradient }}>
            {hasImages ? (
                <AnimatePresence mode="wait">
                    <motion.img
                        key={idx}
                        src={images[idx]}
                        alt="property"
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                </AnimatePresence>
            ) : (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)', fontSize: '52px', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}>🏡</div>
            )}

            {/* Gradient overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,8,23,0.95) 0%, rgba(2,8,23,0.2) 55%, transparent 100%)', zIndex: 2 }} />

            {/* Arrows — only when multiple images */}
            {hasImages && images.length > 1 && (
                <>
                    <button onClick={prev} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'background 0.2s' }}>
                        ‹
                    </button>
                    <button onClick={next} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'background 0.2s' }}>
                        ›
                    </button>
                    {/* Dot indicators */}
                    <div style={{ position: 'absolute', bottom: '48px', left: '50%', transform: 'translateX(-50%)', zIndex: 4, display: 'flex', gap: '5px' }}>
                        {images.map((_, i) => (
                            <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{ width: i === idx ? '18px' : '6px', height: '6px', borderRadius: '3px', background: i === idx ? 'white' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.3s' }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── PROPERTY DETAIL MODAL ────────────────────────────────────────────────────
const PropertyDetail = ({ property: initialProperty, onClose, user }) => {
    const navigate = useNavigate();
    const [property, setProperty] = useState(initialProperty);
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [qaOpened, setQaOpened] = useState(false);

    // Initialize lead tracking when modal opens
    useEffect(() => {
        if (property && user) {
            leadTracker.init(property._id);
            
            // Track images viewed when carousel is interacted with
            leadTracker.trackImagesViewed();
        }
        
        // Cleanup when modal closes
        return () => {
            leadTracker.cleanup();
        };
    }, [property?._id, user]);

    // Track visit when modal opens
    useEffect(() => {
        if (property) {
            api.get(`/properties/${property._id}`).then(res => {
                setProperty(res.data.data.property);
            }).catch(() => {});
        }
    }, []);

    const priceAbbr = (n) => {
        if (!n) return '—';
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
        return `₹${n.toLocaleString()}`;
    };

    const handleLike = async () => {
        try {
            const res = await api.post(`/properties/${property._id}/like`);
            setProperty({ ...property, likes: res.data.data.likes });

            // Track engagement
            leadTracker.trackEngagement('like');

            // Trigger AI Orchestration for the "Like" event
            await api.post('/leads/interact', { propertyId: property._id, action: 'like' }).catch(() => { });
        } catch (e) {
            if (e.response?.status === 403) {
                alert('Please complete your profile to show interest in properties.');
                onClose();
                navigate('/profile');
            } else {
                alert('Please login to like properties');
            }
        }
    };

    const handleOpinion = async (rating) => {
        try {
            const res = await api.post(`/properties/${property._id}/opinion`, { rating });
            setProperty({ ...property, opinions: res.data.data.opinions });
        } catch (e) {
            if (e.response?.status === 403) {
                alert('Please complete your profile to submit opinions.');
                onClose();
                navigate('/profile');
            } else {
                alert('Please login to submit opinions');
            }
        }
    };

    const handleSummarize = async () => {
        setSummarizing(true);
        try {
            const res = await api.post(`/properties/${property._id}/summarize`);
            setProperty({ ...property, aiBrokerSummary: res.data.data.aiBrokerSummary });
        } catch (e) { alert('Failed to regenerate summary'); }
        setSummarizing(false);
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setPosting(true);
        try {
            const res = await api.post(`/properties/${property._id}/comment`, { text: commentText });
            setProperty({ ...property, comments: res.data.data.comments });
            setCommentText('');
            setShowComments(true); // Show comments after posting
        } catch (e) {
            if (e.response?.status === 403) {
                alert('Please complete your profile to post comments.');
                onClose();
                navigate('/profile');
            } else {
                alert('Please login to comment');
            }
        }
        setPosting(false);
    };

    const isLiked = property.likes?.some(l => l.user === user?._id);
    const userOpinion = property.opinions?.find(o => o.user === user?._id)?.rating;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#020817' }}>

            {/* Full Window Container */}
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                {/* Header Strip */}
                <div style={{ padding: '20px 40px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(20px)', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '12px', color: 'white', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>←</button>
                        <div>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: '800', color: 'white' }}>{property.title}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '700' }}>{property.listingType.toUpperCase()}</span>
                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{property.landmark ? `${property.landmark}, ` : ''}{property.location}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(380px, 450px)', background: 'radial-gradient(circle at 0% 0%, rgba(59,130,246,0.05) 0%, transparent 40%)' }} className="custom-scroll">

                    {/* Main Content Area */}
                    <div style={{ padding: '40px' }}>
                        <div style={{ borderRadius: '32px', overflow: 'hidden', marginBottom: '40px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
                            <ImageCarousel images={property.images} height="600px" fallbackGradient="linear-gradient(135deg, #1e3a8a, #4338ca)" />
                        </div>

                        <div style={{ maxWidth: '900px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                                {[
                                    { l: 'Price', v: priceAbbr(property.price), i: '💰', sub: property.negotiable ? 'Negotiable' : 'Fixed Price' },
                                    { l: 'Area', v: `${property.area} ${property.areaUnit}`, i: '📐', sub: 'Built-up Area' },
                                    { l: 'Layout', v: `${property.bedrooms || 0} BHK`, i: '🛏', sub: `${property.bathrooms || 0} Bath • ${property.balconies || 0} Balcony` },
                                    { l: 'Construction', v: property.constructionStatus, i: '🏗', sub: `${property.propertyAge || 0} Years Old` },
                                    { l: 'Furnishing', v: property.furnishingStatus || 'Unfurnished', i: '🛋', sub: 'Ready Status' },
                                    { l: 'Availability', v: property.availableFrom ? new Date(property.availableFrom).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Immediate', i: '📅', sub: property.occupancyStatus || 'Vacant' },
                                ].map((s, i) => (
                                    <div key={i} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div style={{ fontSize: '22px' }}>{s.i}</div>
                                            <div style={{ fontSize: '10px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.l}</div>
                                        </div>
                                        <div style={{ fontSize: '20px', color: 'white', fontWeight: '800', fontFamily: 'Space Grotesk' }}>{s.v}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{s.sub}</div>
                                    </div>
                                ))}
                            </div>

                            <section style={{ marginBottom: '48px', background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '24px', fontFamily: 'Space Grotesk', letterSpacing: '0.5px' }}>TECHNICAL SPECIFICATIONS</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 64px' }}>
                                    {[
                                        { label: 'Maintenance', value: `₹${property.maintenanceCharges?.toLocaleString() || 0} / month` },
                                        { label: 'Floor Level', value: `${property.floorNumber || 'G'} of ${property.totalFloors || '—'}` },
                                        { label: 'Landmark', value: property.landmark || '—' },
                                        { label: 'Pincode', value: property.pincode || '—' },
                                        { label: 'State', value: property.state || '—' },
                                        { label: 'City', value: property.city || '—' },
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '12px' }}>
                                            <span style={{ color: '#475569', fontSize: '14px', fontWeight: '600' }}>{item.label}</span>
                                            <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '700' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section style={{ marginBottom: '48px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🤖</div>
                                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', fontFamily: 'Space Grotesk' }}>AI Broker Insights</h3>
                                    </div>
                                    <button onClick={handleSummarize} disabled={summarizing} style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#60a5fa', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                        {summarizing ? (
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(96,165,250,0.2)', borderTopColor: '#60a5fa', animation: 'spin 0.6s linear infinite' }} />
                                        ) : '✨'}
                                        {summarizing ? 'REGENERATING...' : 'AI REGENERATE'}
                                    </button>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', lineHeight: '1.8', color: '#94a3b8', fontSize: '16px', whiteSpace: 'pre-line' }}>
                                    {property.aiBrokerSummary || "I'm currently analyzing the market potential of this property. Click 'AI REGENERATE' to trigger my professional broker insights."}
                                </div>
                            </section>

                            <section style={{ marginBottom: '48px', display: 'flex', gap: '24px' }}>
                                <div style={{ flex: 1, background: 'rgba(59,130,246,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(59,130,246,0.1)' }}>
                                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Visitor Stats</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div>
                                            <div style={{ fontSize: '24px', color: 'white', fontWeight: '800', fontFamily: 'Space Grotesk' }}>{property.visitCount || 0}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TOTAL VISITS</div>
                                        </div>
                                        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />
                                        <div>
                                            <div style={{ fontSize: '24px', color: '#60a5fa', fontWeight: '800', fontFamily: 'Space Grotesk' }}>{property.interestCount || 0}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>INTERESTED</div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, background: 'rgba(245,158,11,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(245,158,11,0.1)' }}>
                                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Owner Trust</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: '800', fontFamily: 'Space Grotesk' }}>⭐ {property.seller?.ownerRating?.toFixed(1) || '4.5'}</div>
                                        <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '10px', color: '#10b981', fontWeight: '800' }}>VERIFIED OWNER</div>
                                    </div>
                                </div>
                            </section>

                            <section style={{ marginBottom: '48px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '20px', fontFamily: 'Space Grotesk' }}>Vastu (vāstu) Analysis</h3>
                                <div style={{ background: 'rgba(16,185,129,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(16,185,129,0.1)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: '24px' }}>✨</div>
                                    <p style={{ color: '#6ee7b7', fontSize: '15px' }}>{property.vastuInfo || "No Vastu details provided for this property."}</p>
                                </div>
                            </section>

                            {property.previousUsage?.length > 0 && (
                                <section style={{ marginBottom: '48px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '20px', fontFamily: 'Space Grotesk' }}>Property History</h3>
                                    <div style={{ borderLeft: '2px solid rgba(59,130,246,0.2)', paddingLeft: '24px', marginLeft: '10px' }}>
                                        {property.previousUsage.map((u, i) => (
                                            <div key={i} style={{ position: 'relative', marginBottom: '16px' }}>
                                                <div style={{ position: 'absolute', left: '-31px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', border: '3px solid #020817' }} />
                                                <div style={{ fontSize: '14px', color: 'white', fontWeight: '700' }}>{u.userType} — {u.purpose}</div>
                                                <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>Occupied for {u.duration}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section style={{ marginBottom: '48px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '20px', fontFamily: 'Space Grotesk' }}>Description</h3>
                                <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7' }}>{property.description}</p>
                            </section>

                            {/* Q&A Section - Show only answered questions */}
                            {property.sellerQA && property.sellerQA.filter(qa => qa.answer && qa.answer.trim()).length > 0 && (
                                <section 
                                    style={{ marginBottom: '48px' }}
                                    onMouseEnter={() => {
                                        if (!qaOpened) {
                                            setQaOpened(true);
                                            const totalAnswers = property.sellerQA.filter(qa => qa.answer && qa.answer.trim()).length;
                                            leadTracker.trackQAOpened(totalAnswers);
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '12px',
                                            background: 'rgba(139,92,246,0.15)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px'
                                        }}>
                                            💬
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', fontFamily: 'Space Grotesk', marginBottom: '2px' }}>
                                                Owner's Answers
                                            </h3>
                                            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                                                {property.sellerQA.filter(qa => qa.answer && qa.answer.trim()).length} questions answered by the property owner
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {property.sellerQA
                                            .filter(qa => qa.answer && qa.answer.trim())
                                            .map((qa, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onMouseEnter={() => leadTracker.trackQAAnswerRead()}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.02)',
                                                        border: '1px solid rgba(255,255,255,0.06)',
                                                        borderRadius: '20px',
                                                        padding: '24px',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {/* Subtle gradient background */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        right: 0,
                                                        width: '150px',
                                                        height: '150px',
                                                        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                                                        pointerEvents: 'none'
                                                    }} />

                                                    {/* Category Badge */}
                                                    <div style={{
                                                        display: 'inline-block',
                                                        padding: '4px 12px',
                                                        borderRadius: '8px',
                                                        background: 'rgba(139,92,246,0.1)',
                                                        border: '1px solid rgba(139,92,246,0.2)',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        color: '#a78bfa',
                                                        marginBottom: '12px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        {qa.category}
                                                    </div>

                                                    {/* Question */}
                                                    <div style={{
                                                        fontSize: '16px',
                                                        fontWeight: '700',
                                                        color: 'white',
                                                        marginBottom: '12px',
                                                        lineHeight: '1.5',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <span style={{ color: '#60a5fa', flexShrink: 0 }}>Q:</span>
                                                        <span>{qa.question}</span>
                                                    </div>

                                                    {/* Answer */}
                                                    <div style={{
                                                        fontSize: '15px',
                                                        color: '#94a3b8',
                                                        lineHeight: '1.7',
                                                        paddingLeft: '24px',
                                                        borderLeft: '3px solid rgba(139,92,246,0.3)',
                                                        marginTop: '12px',
                                                        position: 'relative'
                                                    }}>
                                                        <div style={{
                                                            position: 'absolute',
                                                            left: '-12px',
                                                            top: '2px',
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: '50%',
                                                            background: 'rgba(139,92,246,0.2)',
                                                            border: '2px solid rgba(139,92,246,0.4)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '10px',
                                                            fontWeight: '800',
                                                            color: '#a78bfa'
                                                        }}>
                                                            A
                                                        </div>
                                                        {qa.answer}
                                                    </div>

                                                    {/* Answered date */}
                                                    {qa.answeredAt && (
                                                        <div style={{
                                                            marginTop: '12px',
                                                            fontSize: '11px',
                                                            color: '#475569',
                                                            fontStyle: 'italic',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <polyline points="12 6 12 12 16 14" />
                                                            </svg>
                                                            Answered {new Date(qa.answeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                    </div>

                                    {/* Info Box */}
                                    <div style={{
                                        marginTop: '24px',
                                        padding: '16px 20px',
                                        borderRadius: '16px',
                                        background: 'rgba(59,130,246,0.05)',
                                        border: '1px solid rgba(59,130,246,0.15)',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px'
                                    }}>
                                        <div style={{ fontSize: '18px', flexShrink: 0 }}>💡</div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                                            <strong style={{ color: '#60a5fa' }}>Verified Answers:</strong> These responses are provided directly by the property owner to help you make an informed decision. Have more questions? Use the chat feature to connect with the owner.
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Social Sidebar (Fixed on Scroll) */}
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(2,8,23,0.4)', padding: '40px', position: 'sticky', top: 0, height: 'calc(100vh - 81px)', overflowY: 'auto' }} className="custom-scroll">

                        {/* Interaction Card */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>PROPERTY ENGAGEMENT</span>
                                <button onClick={handleLike} style={{ background: isLiked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isLiked ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`, padding: '8px 16px', borderRadius: '12px', color: isLiked ? '#ef4444' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}>
                                    {isLiked ? '❤️' : '🤍'} {property.likes?.length || 0}
                                </button>
                            </div>

                            <button
                                onClick={() => navigate(`/agent-chat?propertyId=${property._id}`)}
                                style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', fontWeight: '800', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
                            >
                                🤖 Ask AI About This Property
                            </button>

                            <button
                                onClick={() => {
                                    // Navigate to messages - tracking will happen when buyer actually sends message
                                    navigate(`/messages?contactId=${property.seller._id}&propertyId=${property._id}`);
                                }}
                                style={{ 
                                    width: '100%', 
                                    padding: '14px', 
                                    borderRadius: '16px', 
                                    background: 'linear-gradient(135deg, #10b981, #059669)', 
                                    border: 'none', 
                                    color: 'white', 
                                    fontWeight: '800', 
                                    cursor: 'pointer', 
                                    marginBottom: '16px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '8px', 
                                    boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.4)';
                                }}
                            >
                                💬 Message Owner About This Property
                            </button>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                                {['Good', 'Nice', 'Best', 'Awesome'].map(opt => (
                                    <button key={opt} onClick={() => handleOpinion(opt)}
                                        style={{ padding: '14px 10px', borderRadius: '14px', border: `1px solid ${userOpinion === opt ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`, background: userOpinion === opt ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', color: userOpinion === opt ? '#60a5fa' : '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>{opt === 'Good' ? '👍' : opt === 'Nice' ? '😊' : opt === 'Best' ? '🌟' : '🔥'}</div>
                                        {opt.toUpperCase()}
                                        <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '2px' }}>{property.opinions?.filter(o => o.rating === opt).length || 0} VOTES</div>
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleComment}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Add a Comment</div>
                                <div style={{ position: 'relative' }}>
                                    <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="What do you think of this property?" style={{ width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'Inter' }} />
                                    <button type="submit" disabled={posting || !commentText.trim()} style={{ width: '100%', height: '48px', marginTop: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: (posting || !commentText.trim()) ? 0.5 : 1, transition: 'transform 0.2s' }}>
                                        {posting ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Toggleable Comments Section */}
                        <div>
                            <button onClick={() => setShowComments(!showComments)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', borderRadius: '16px', color: 'white', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <span>💬 Community Chat ({property.comments?.length || 0})</span>
                                <span style={{ transform: showComments ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>▼</span>
                            </button>

                            <AnimatePresence>
                                {showComments && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                        <div style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {property.comments?.length > 0 ? property.comments.slice().reverse().map((c, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <div style={{ minWidth: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', fontWeight: '800' }}>{c.username?.[0]?.toUpperCase() || 'U'}</div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{c.username}</span>
                                                            <span style={{ fontSize: '11px', color: '#334155' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.4' }}>{c.text}</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div style={{ textAlign: 'center', padding: '32px', opacity: 0.3, fontSize: '14px', color: 'white', fontStyle: 'italic' }}>No comments yet.</div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const BuyerDiscovery = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterListing, setFilterListing] = useState('All');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [toast, setToast] = useState(null);
    const [user, setUser] = useState(null);
    const [savedPropertyIds, setSavedPropertyIds] = useState(new Set());
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        api.get('/users/me').then(r => {
            setUser(r.data.data.user);
            // Load saved property IDs
            if (r.data.data.user.savedProperties) {
                setSavedPropertyIds(new Set(r.data.data.user.savedProperties.map(id => id.toString())));
            }
        }).catch(() => { });
        
        api.get('/properties').then(r => { 
            setProperties(r.data.data.properties); 
            setLoading(false);
            
            // Check if propertyId is in URL and open that property
            const propertyId = searchParams.get('propertyId');
            if (propertyId) {
                const property = r.data.data.properties.find(p => p._id === propertyId);
                if (property) {
                    setSelectedProperty(property);
                }
            }
        }).catch(() => setLoading(false));
    }, [searchParams]);
    
    const handleSaveToggle = async (propertyId, e) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/properties/${propertyId}/save`);
            const isSaved = res.data.data.saved;
            
            // Track engagement if saved
            if (isSaved) {
                leadTracker.trackEngagement('save');
            }
            
            setSavedPropertyIds(prev => {
                const newSet = new Set(prev);
                if (isSaved) {
                    newSet.add(propertyId);
                } else {
                    newSet.delete(propertyId);
                }
                return newSet;
            });
        } catch (err) {
            console.error('Error toggling save:', err);
            alert('Failed to save property. Please try again.');
        }
    };

    // ── 90s Dwell Time Tracking ──────────────────────────────────────────────
    useEffect(() => {
        let timer;
        if (selectedProperty && user?.profileCompleted) {
            console.log(`[DWELL] Timer started for property: ${selectedProperty._id}`);
            timer = setTimeout(async () => {
                console.log(`[DWELL] 90s reached. Triggering orchestration agent...`);
                try {
                    await api.post('/leads/interact', { propertyId: selectedProperty._id, action: 'dwell_90s' });
                } catch (err) {
                    console.warn('[DWELL] Interest tracking skipped');
                }
            }, 90000); // 1.5 minutes
        }
        return () => {
            if (timer) {
                clearTimeout(timer);
                console.log(`[DWELL] Timer cleared`);
            }
        };
    }, [selectedProperty, user]);

    const priceAbbr = (n) => {
        if (!n) return '—';
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
        return `₹${n.toLocaleString()}`;
    };

    const GRADIENTS = [
        'linear-gradient(135deg, #0f1f3d 0%, #1e3a5f 100%)',
        'linear-gradient(135deg, #1a0f3d 0%, #3b1f6e 100%)',
        'linear-gradient(135deg, #0f3020 0%, #1a5a3a 100%)',
        'linear-gradient(135deg, #3d1a0f 0%, #6b3020 100%)',
        'linear-gradient(135deg, #0d2a3d 0%, #1a4a6e 100%)',
        'linear-gradient(135deg, #2d1a3d 0%, #5a3070 100%)',
    ];

    const STATUS_COLOR = { Sale: '#3b82f6', Rent: '#10b981', Lease: '#f59e0b' };

    const cities = ['All', ...new Set(properties.map(p => p.city).filter(Boolean))];
    const listingTypes = ['All', 'Sale', 'Rent', 'Lease'];

    const filtered = properties.filter(p => {
        const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === 'All' || p.city === filterType;
        const matchListing = filterListing === 'All' || p.listingType === filterListing;
        return matchSearch && matchType && matchListing;
    });

    return (
        <div style={{ background: 'radial-gradient(ellipse at 10% 20%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(139,92,246,0.06) 0%, transparent 50%), #020817', minHeight: '100vh', overflowX: 'hidden' }}>
            <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)', backgroundSize: '56px 56px', zIndex: 0, pointerEvents: 'none' }} />

            <Navbar user={user} />

            <AnimatePresence>
                {selectedProperty && (
                    <PropertyDetail property={selectedProperty} user={user} onClose={() => setSelectedProperty(null)} />
                )}
            </AnimatePresence>

            <div className="sidebar" style={{ top: '64px' }}>
                <div style={{ padding: '20px 16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'white', fontWeight: '800', marginBottom: '16px' }}>
                        {user?.name?.[0]?.toUpperCase() || 'B'}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{user?.name || 'Buyer Account'}</div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{user?.profession || 'Verified Buyer'}</div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 16px' }} />

                {[
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>, label: 'Discovery', active: true, action: () => { } },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>, label: '🔍 Smart Search', action: () => navigate('/search'), highlight: true },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, label: 'Messages', action: () => navigate('/messages') },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, label: 'My Profile', action: () => navigate('/profile') },
                    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>, label: 'Saved', action: () => navigate('/saved') },
                ].map(item => (
                    <button key={item.label} className={`sidebar-item ${item.active ? 'active' : ''}`} onClick={item.action} style={item.highlight ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' } : {}}>
                        {item.icon}{item.label}
                    </button>
                ))}

                <div style={{ flex: 1 }} />

                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', margin: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#6ee7b7', textTransform: 'uppercase' }}>Broker AI Mode</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.5' }}>Personalized analysis based on your {user?.profession || 'interests'}.</div>
                </div>
            </div>

            <div className="main-content">
                <div style={{ padding: '48px 40px 60px', maxWidth: '1440px', margin: '0' }}>

                    {/* HERO HEADER */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '48px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)', marginBottom: '20px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' }} />
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', letterSpacing: '0.5px' }}>Premium Property Discovery</span>
                        </div>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '800', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '14px' }}>
                            <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Find Your Perfect</span>
                            <br /><span style={{ color: 'white' }}>Home & Community</span>
                        </h1>
                        <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.7, maxWidth: '560px' }}>
                            Explore luxury estates and modern living. Click on any card to view detailed AI-powered broker insights, Vastu analysis, and social interactions.
                        </p>
                    </motion.div>

                    {/* SEARCH + FILTERS */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
                            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#475569', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '46px', height: '50px', borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '14px', outline: 'none' }}
                                placeholder="Search by city, title, or location..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {listingTypes.map(t => (
                                <button key={t} onClick={() => setFilterListing(t)} style={{ padding: '8px 16px', borderRadius: '10px', border: `1.5px solid ${filterListing === t ? (STATUS_COLOR[t] || 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.07)'}`, background: filterListing === t ? `${STATUS_COLOR[t] || 'rgba(255,255,255,0.1)'}18` : 'rgba(255,255,255,0.03)', color: filterListing === t ? (STATUS_COLOR[t] || 'white') : '#475569', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Count */}
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '28px', fontWeight: '500' }}>
                        Showing <span style={{ color: 'white', fontWeight: '700' }}>{filtered.length}</span> {filtered.length === 1 ? 'property' : 'properties'}
                    </div>

                    {/* GRID */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '320px', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.15)', borderTopColor: '#3b82f6', animation: 'spin 0.9s linear infinite' }} />
                            <span style={{ color: '#475569', fontSize: '14px' }}>Loading the collection...</span>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                            {filtered.map((p, i) => (
                                <motion.div key={p._id}
                                    initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 28 }}
                                    onClick={() => setSelectedProperty(p)}
                                    style={{ borderRadius: '24px', overflow: 'hidden', background: 'rgba(13,21,38,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.3s', cursor: 'pointer' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-8px)';
                                        e.currentTarget.style.boxShadow = '0 28px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,179,237,0.25)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >

                                    <div style={{ position: 'relative' }}>
                                        <ImageCarousel images={p.images} fallbackGradient={GRADIENTS[i % GRADIENTS.length]} />
                                        <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 4, padding: '4px 12px', borderRadius: '999px', background: `${STATUS_COLOR[p.listingType] || '#3b82f6'}28`, border: `1px solid ${STATUS_COLOR[p.listingType] || '#3b82f6'}60`, fontSize: '10px', fontWeight: '800', color: STATUS_COLOR[p.listingType] || '#60a5fa', letterSpacing: '1px' }}>
                                            FOR {p.listingType?.toUpperCase() || 'SALE'}
                                        </div>
                                        
                                        {/* Save Button */}
                                        <button
                                            onClick={(e) => handleSaveToggle(p._id, e)}
                                            style={{
                                                position: 'absolute',
                                                top: '14px',
                                                right: '14px',
                                                zIndex: 4,
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: savedPropertyIds.has(p._id) ? 'rgba(245,158,11,0.9)' : 'rgba(0,0,0,0.5)',
                                                border: savedPropertyIds.has(p._id) ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                backdropFilter: 'blur(10px)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill={savedPropertyIds.has(p._id) ? 'white' : 'none'} stroke="white" strokeWidth="2">
                                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                            </svg>
                                        </button>
                                        
                                        <div style={{ position: 'absolute', bottom: '14px', right: '14px', zIndex: 3, fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '22px', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                                            {priceAbbr(p.price)}
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '14px', left: '14px', zIndex: 3, display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                                                {p.seller?.name?.[0]?.toUpperCase() || 'A'}
                                            </div>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>{p.seller?.name || 'Agent'}</span>
                                        </div>
                                    </div>

                                    <div style={{ padding: '20px 22px 22px' }}>
                                        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '17px', color: 'white', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '13px', marginBottom: '14px' }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            {p.location || p.city || '—'}
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                            {p.bedrooms && <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '12px', color: '#93c5fd', fontWeight: '600' }}>🛏 {p.bedrooms}</span>}
                                            {p.area && <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '12px', color: '#fcd34d', fontWeight: '600' }}>📐 {p.area}</span>}
                                            <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>💬 {p.comments?.length || 0}</span>
                                            <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>❤️ {p.likes?.length || 0}</span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>VIEW DETAILS</span>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default BuyerDiscovery;
