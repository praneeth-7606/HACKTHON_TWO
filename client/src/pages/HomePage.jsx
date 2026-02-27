import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const HomePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeFeature, setActiveFeature] = useState(0);
    const [stats, setStats] = useState({ properties: 0, users: 0, matches: 0 });

    useEffect(() => {
        api.get('/users/me').then(res => setUser(res.data.data.user)).catch(() => {});
        
        // Animate stats
        const interval = setInterval(() => {
            setStats(prev => ({
                properties: Math.min(prev.properties + 5, 250),
                users: Math.min(prev.users + 3, 150),
                matches: Math.min(prev.matches + 2, 98)
            }));
        }, 30);
        
        setTimeout(() => clearInterval(interval), 2000);
        
        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: '🤖',
            title: 'AI-Powered Matching',
            description: 'Our advanced AI analyzes your preferences and matches you with perfect properties in seconds',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            stats: '95% Match Accuracy'
        },
        {
            icon: '⚡',
            title: 'Lightning-Fast Responses',
            description: 'Get replies from verified sellers within 2-3 minutes. No more waiting days for responses!',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            stats: 'Avg. 2.5 Min Response'
        },
        {
            icon: '🎯',
            title: 'Smart Lead Scoring',
            description: 'Sellers receive high-quality, pre-qualified leads with detailed buyer insights',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            stats: '85% Conversion Rate'
        },
        {
            icon: '💬',
            title: 'Real-Time Chat',
            description: 'Connect instantly with property owners through our seamless messaging platform',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            stats: 'Instant Connection'
        }
    ];

    const benefits = [
        { icon: '✅', text: 'Verified Property Owners', color: '#10b981' },
        { icon: '🔒', text: 'Secure & Private', color: '#3b82f6' },
        { icon: '📊', text: 'Detailed Analytics', color: '#f59e0b' },
        { icon: '🎨', text: 'Beautiful UI/UX', color: '#8b5cf6' },
        { icon: '🚀', text: 'Fast Performance', color: '#ef4444' },
        { icon: '💎', text: 'Premium Experience', color: '#ec4899' }
    ];

    return (
        <div style={{ background: '#020817', minHeight: '100vh', color: 'white', overflow: 'hidden' }}>
            {/* Animated Background */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
                <div style={{ position: 'absolute', top: '10%', left: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 20s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 25s ease-in-out infinite reverse' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'pulse 15s ease-in-out infinite' }} />
            </div>

            {/* Navigation */}
            <nav style={{ position: 'relative', zIndex: 10, padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}>🏡</div>
                    <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Space Grotesk', background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EstatePulse</span>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {user ? (
                        <>
                            {user.role === 'buyer' && (
                                <button onClick={() => navigate('/search')} style={{ padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                                    🔍 Smart Search
                                </button>
                            )}
                            <button onClick={() => navigate(user.role === 'buyer' ? '/buyer' : '/seller')} style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                Dashboard
                            </button>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800' }}>
                                {user.name[0].toUpperCase()}
                            </div>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate('/auth')} style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                Sign In
                            </button>
                            <button onClick={() => navigate('/auth')} style={{ padding: '12px 28px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.4)', transition: 'all 0.2s' }}>
                                Get Started
                            </button>
                        </>
                    )}
                </motion.div>
            </nav>

            {/* Hero Section */}
            <section style={{ position: 'relative', zIndex: 1, padding: '120px 48px 80px', maxWidth: '1400px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '999px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '32px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981', animation: 'pulse 2s ease-in-out infinite' }} />
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#60a5fa' }}>AI-Powered Real Estate Platform</span>
                    </motion.div>
                    
                    <h1 style={{ fontSize: 'clamp(48px, 8vw, 84px)', fontWeight: '900', lineHeight: 1.1, marginBottom: '32px', fontFamily: 'Space Grotesk' }}>
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Find Your Dream</span>
                        <br />
                        <span style={{ color: 'white' }}>Property in Minutes</span>
                    </h1>
                    
                    <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 48px', lineHeight: 1.7 }}>
                        Experience the future of real estate with AI-powered matching, instant seller responses, and seamless property discovery.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')} style={{ padding: '18px 40px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: 'white', fontSize: '18px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 12px 32px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span>Start Exploring</span>
                            <span style={{ fontSize: '20px' }}>→</span>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '18px 40px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '18px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                            Watch Demo
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
                    {[
                        { value: stats.properties, label: 'Active Properties', suffix: '+' },
                        { value: stats.users, label: 'Happy Users', suffix: '+' },
                        { value: stats.matches, label: 'Success Rate', suffix: '%' }
                    ].map((stat, i) => (
                        <div key={i} style={{ padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: '900', background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Space Grotesk' }}>
                                {stat.value}{stat.suffix}
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* Features Section */}
            <section style={{ position: 'relative', zIndex: 1, padding: '80px 48px', maxWidth: '1400px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: '900', marginBottom: '20px', fontFamily: 'Space Grotesk' }}>
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Why Choose</span> EstatePulse?
                    </h2>
                    <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
                        Revolutionary features that make property hunting effortless and efficient
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            onHoverStart={() => setActiveFeature(i)}
                            style={{
                                padding: '40px',
                                borderRadius: '32px',
                                background: activeFeature === i ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${activeFeature === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                                backdropFilter: 'blur(20px)',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: feature.gradient, opacity: activeFeature === i ? 1 : 0, transition: 'opacity 0.3s' }} />
                            
                            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: feature.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '24px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}>
                                {feature.icon}
                            </div>
                            
                            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', fontFamily: 'Space Grotesk' }}>{feature.title}</h3>
                            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '20px' }}>{feature.description}</p>
                            
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#60a5fa' }}>{feature.stats}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Benefits Grid */}
            <section style={{ position: 'relative', zIndex: 1, padding: '80px 48px', maxWidth: '1400px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                style={{
                                    padding: '24px',
                                    borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <div style={{ fontSize: '24px' }}>{benefit.icon}</div>
                                <span style={{ fontSize: '15px', fontWeight: '600', color: benefit.color }}>{benefit.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* CTA Section */}
            <section style={{ position: 'relative', zIndex: 1, padding: '80px 48px 120px', maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    style={{
                        padding: '80px 60px',
                        borderRadius: '40px',
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(30px)',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', animation: 'rotate 20s linear infinite' }} />
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '900', marginBottom: '24px', fontFamily: 'Space Grotesk' }}>
                            Ready to Find Your <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dream Property?</span>
                        </h2>
                        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                            Join thousands of happy users who found their perfect home with EstatePulse
                        </p>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')} style={{ padding: '20px 48px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: 'white', fontSize: '18px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 16px 40px rgba(59,130,246,0.5)' }}>
                            Get Started Free
                        </motion.button>
                    </div>
                </motion.div>
            </section>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, -30px); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                }
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default HomePage;
