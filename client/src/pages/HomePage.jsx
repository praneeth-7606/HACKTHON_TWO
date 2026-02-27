import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/* ── Animated counter hook ── */
function useCounter(target, duration = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    useEffect(() => {
        if (!isInView || target <= 0) return;
        let start = 0;
        const inc = target / (duration / 16);
        const timer = setInterval(() => {
            start += inc;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [isInView, target, duration]);

    return [count, ref];
}

/* ── Typewriter hook ── */
function useTypewriter(text, speed = 60, startDelay = 800) {
    const [displayedText, setDisplayedText] = useState('');
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const delayTimer = setTimeout(() => setStarted(true), startDelay);
        return () => clearTimeout(delayTimer);
    }, [startDelay]);

    useEffect(() => {
        if (!started) return;
        let i = 0;
        const timer = setInterval(() => {
            setDisplayedText(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(timer);
        }, speed);
        return () => clearInterval(timer);
    }, [started, text, speed]);

    return displayedText;
}

/* ── Stagger animation variants ── */
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 90 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.8, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 18, stiffness: 100 } } };
const slideInLeft = { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 22 } } };
const slideInRight = { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 22 } } };

/* ── Floating Particle ── */
const FloatingParticle = ({ delay, size, left, top, color }) => (
    <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 5 + Math.random() * 4, repeat: Infinity, delay, ease: 'easeInOut' }}
        style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: color, filter: 'blur(1px)', left, top, pointerEvents: 'none', zIndex: 0 }}
    />
);

const HomePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.95]);

    const typedText = useTypewriter('Property in Minutes', 55, 600);

    useEffect(() => {
        api.get('/users/me').then(res => setUser(res.data.data.user)).catch(() => { });
    }, []);

    const features = [
        { icon: '🤖', title: 'AI-Powered Matching', description: 'Our Mistral AI analyzes preferences and matches you with perfect properties in seconds', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', stat: '95% Accuracy' },
        { icon: '⚡', title: 'Lightning Responses', description: 'Get replies from verified sellers within minutes. SLA-tracked so no lead goes cold', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', stat: '< 3 Min Avg' },
        { icon: '🎯', title: 'Smart Lead Scoring', description: 'Sellers receive pre-qualified leads with detailed buyer intent scores and engagement data', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', stat: '85% Conversion' },
        { icon: '💬', title: 'Real-Time Messaging', description: 'Connect instantly with property owners through our seamless, property-contextual chat', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)', stat: 'Instant Connect' },
    ];

    const howItWorks = [
        { step: '01', title: 'Search with AI', desc: 'Tell our AI what you need in natural language — budget, location, size', icon: '🔍' },
        { step: '02', title: 'Discover Matches', desc: 'Browse curated property cards with images, Q&A, and AI summaries', icon: '🏡' },
        { step: '03', title: 'Connect & Message', desc: 'Like properties, send messages, and get instant seller responses', icon: '💬' },
        { step: '04', title: 'Close the Deal', desc: 'Track leads, compare properties, and close deals faster than ever', icon: '🎯' },
    ];

    const trendingLocations = [
        { name: 'Whitefield', count: 45, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
        { name: 'Koramangala', count: 38, gradient: 'linear-gradient(135deg, #f5576c, #ff6f91)' },
        { name: 'HSR Layout', count: 32, gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
        { name: 'Indiranagar', count: 28, gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
        { name: 'Marathahalli', count: 24, gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
        { name: 'Electronic City', count: 22, gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
    ];

    const testimonials = [
        { quote: "EstatePulse AI scored our incoming buyer as 94/100 before we even picked up the phone. That lead closed in 6 days. The SLA tracking kept our team on top of every response.", name: 'Rahul Sharma', role: 'Senior Agent, PropertyFirst', initial: 'R' },
        { quote: "The smart search is incredible. I described my dream home in plain English and got 12 perfect matches instantly. We moved in within 3 weeks!", name: 'Priya Kapoor', role: 'Homebuyer, Bangalore', initial: 'P' },
        { quote: "As a seller, the lead scoring completely changed my workflow. I now focus only on hot leads and my conversion rate tripled in just 2 months.", name: 'Arun Mehta', role: 'Property Developer', initial: 'A' },
    ];

    // Auto-advance testimonial carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveTestimonial(prev => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const [propCount, propRef] = useCounter(250);
    const [userCount, userRef] = useCounter(150);
    const [matchCount, matchRef] = useCounter(98);
    const [cityCount, cityRef] = useCounter(12);

    return (
        <div style={{ background: '#0a1628', minHeight: '100vh', color: 'white', overflow: 'hidden' }}>
            {/* Animated Background with Particles */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '5%', left: '10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float 20s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float 25s ease-in-out infinite reverse' }} />
                <div style={{ position: 'absolute', top: '40%', left: '50%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float 22s ease-in-out infinite 3s' }} />
                <div className="grid-pattern" />
                {/* Floating Particles */}
                <FloatingParticle delay={0} size="6px" left="15%" top="20%" color="rgba(59,130,246,0.4)" />
                <FloatingParticle delay={1.5} size="4px" left="80%" top="15%" color="rgba(139,92,246,0.4)" />
                <FloatingParticle delay={0.8} size="5px" left="60%" top="70%" color="rgba(59,130,246,0.3)" />
                <FloatingParticle delay={2} size="3px" left="25%" top="60%" color="rgba(16,185,129,0.4)" />
                <FloatingParticle delay={3} size="5px" left="90%" top="45%" color="rgba(139,92,246,0.3)" />
                <FloatingParticle delay={1} size="4px" left="40%" top="85%" color="rgba(59,130,246,0.35)" />
                <FloatingParticle delay={2.5} size="3px" left="70%" top="35%" color="rgba(245,158,11,0.3)" />
            </div>

            {/* ═══════════ NAVIGATION ═══════════ */}
            <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 20, delay: 0.1 }}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 clamp(16px, 4vw, 48px)', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <motion.div whileHover={{ scale: 1.02 }} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(59,130,246,0.3)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Space Grotesk', background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EstatePulse</span>
                </motion.div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {user ? (
                        <>
                            {user.role === 'buyer' && (
                                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/search')}
                                    style={{ padding: '9px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🔍 AI Search
                                </motion.button>
                            )}
                            <motion.button whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.95 }} onClick={() => navigate(user.role === 'buyer' ? '/buyer' : user.role === 'admin' ? '/admin' : '/seller')}
                                style={{ padding: '9px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>
                                Dashboard
                            </motion.button>
                            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
                                {user.name[0].toUpperCase()}
                            </motion.div>
                        </>
                    ) : (
                        <>
                            <motion.button whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')} style={{ padding: '9px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>Sign In</motion.button>
                            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 14px 40px rgba(59,130,246,0.5)' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')}
                                style={{ padding: '9px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px', boxShadow: '0 6px 20px rgba(59,130,246,0.4)', position: 'relative', overflow: 'hidden' }}>
                                Get Started
                                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '200%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />
                            </motion.button>
                        </>
                    )}
                </div>
            </motion.nav>

            {/* ═══════════ HERO ═══════════ */}
            <section ref={heroRef} style={{ position: 'relative', zIndex: 1, padding: 'clamp(120px, 15vw, 160px) clamp(16px, 4vw, 48px) 80px', maxWidth: '1400px', margin: '0 auto' }}>
                <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}>
                    <motion.div variants={stagger} initial="hidden" animate="visible" style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <motion.div variants={scaleIn} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '999px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '32px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#60a5fa', letterSpacing: '0.5px' }}>Powered by Mistral AI</span>
                        </motion.div>

                        <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: '900', lineHeight: 1.05, marginBottom: '28px', fontFamily: 'Space Grotesk', letterSpacing: '-2px' }}>
                            <motion.span
                                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                                style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 25%, #c084fc 50%, #818cf8 75%, #60a5fa 100%)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                            >Find Your Dream</motion.span>
                            <br />
                            <span style={{ color: 'white' }}>{typedText}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} style={{ color: '#60a5fa', fontWeight: '100' }}>|</motion.span></span>
                        </motion.h1>

                        <motion.p variants={fadeUp} style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#94a3b8', maxWidth: '680px', margin: '0 auto 48px', lineHeight: 1.7 }}>
                            AI-powered matching, instant seller responses, smart lead scoring, and seamless property discovery — all in one platform.
                        </motion.p>

                        <motion.div variants={fadeUp} style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(59,130,246,0.5)' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')}
                                style={{ padding: '16px 40px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: 'white', fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: '800', cursor: 'pointer', boxShadow: '0 12px 32px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden' }}>
                                Start Exploring
                                <motion.svg animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7l7 7-7 7" /></motion.svg>
                                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '200%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/search')}
                                style={{ padding: '16px 40px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s' }}>
                                <span>🔍</span> Try AI Search
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Stats Counters */}
                <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', maxWidth: '1000px', margin: '0 auto' }}>
                    {[
                        { value: propCount, suffix: '+', label: 'Active Properties', ref: propRef, color: '#3b82f6', icon: '🏠' },
                        { value: userCount, suffix: '+', label: 'Happy Users', ref: userRef, color: '#10b981', icon: '👥' },
                        { value: matchCount, suffix: '%', label: 'Match Rate', ref: matchRef, color: '#8b5cf6', icon: '🎯' },
                        { value: cityCount, suffix: '+', label: 'Cities Covered', ref: cityRef, color: '#f59e0b', icon: '🌆' },
                    ].map((stat, i) => (
                        <motion.div key={i} variants={fadeUp} whileHover={{ y: -8, boxShadow: `0 16px 40px ${stat.color}25`, borderColor: `${stat.color}40` }} ref={stat.ref}
                            style={{ padding: '28px 20px', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', textAlign: 'center', transition: 'all 0.4s', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${stat.color}, transparent)` }} />
                            <div style={{ fontSize: '20px', marginBottom: '8px' }}>{stat.icon}</div>
                            <div style={{ fontSize: '42px', fontWeight: '900', color: stat.color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{stat.value}{stat.suffix}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ═══════════ HOW IT WORKS ═══════════ */}
            <section style={{ position: 'relative', zIndex: 1, padding: '80px clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', damping: 20 }}
                    style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', delay: 0.2 }}
                        style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px', border: '1px solid rgba(59,130,246,0.2)' }}>⚙️</motion.div>
                    <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '900', marginBottom: '12px', fontFamily: 'Space Grotesk' }}>
                        How It <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Works</span>
                    </h2>
                    <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>Four simple steps to your perfect property</p>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    {howItWorks.map((item, i) => (
                        <motion.div key={i} variants={i % 2 === 0 ? slideInLeft : slideInRight}
                            whileHover={{ y: -10, boxShadow: '0 20px 50px rgba(0,0,0,0.35)', borderColor: 'rgba(99,179,237,0.35)', background: 'rgba(255,255,255,0.04)' }}
                            style={{ padding: '32px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative', transition: 'all 0.4s', cursor: 'pointer' }}>
                            {/* Connecting line */}
                            {i < 3 && <div style={{ position: 'absolute', top: '40px', right: '-12px', width: '24px', height: '2px', background: 'linear-gradient(90deg, rgba(59,130,246,0.3), transparent)', zIndex: 2, display: 'none' }} className="step-connector" />}
                            <motion.div whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}
                                style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 16px', border: '1px solid rgba(59,130,246,0.15)' }}>{item.icon}</motion.div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#3b82f6', letterSpacing: '2px', marginBottom: '10px' }}>STEP {item.step}</div>
                            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '10px', fontFamily: 'Space Grotesk' }}>{item.title}</h3>
                            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>{item.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ═══════════ FEATURES ═══════════ */}
            <section style={{ position: 'relative', zIndex: 1, padding: '80px clamp(16px, 4vw, 48px)', maxWidth: '1400px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', damping: 20 }}
                    style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', delay: 0.2 }}
                        style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px', border: '1px solid rgba(139,92,246,0.2)' }}>✨</motion.div>
                    <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '900', marginBottom: '12px', fontFamily: 'Space Grotesk' }}>
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Why Choose</span> EstatePulse?
                    </h2>
                    <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Revolutionary features that make property hunting effortless</p>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {features.map((feature, i) => (
                        <motion.div key={i} variants={fadeUp}
                            whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', borderColor: 'rgba(99,179,237,0.3)', background: 'rgba(255,255,255,0.04)' }}
                            style={{ padding: '32px', borderRadius: '22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', display: 'flex', gap: '20px', alignItems: 'flex-start', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all 0.4s' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: feature.gradient, opacity: 0.6 }} />
                            <motion.div whileHover={{ scale: 1.15, rotate: 5 }} transition={{ type: 'spring' }}
                                style={{ width: '56px', height: '56px', borderRadius: '16px', background: feature.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                                {feature.icon}
                            </motion.div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', fontFamily: 'Space Grotesk' }}>{feature.title}</h3>
                                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '14px' }}>{feature.description}</p>
                                <motion.div whileHover={{ scale: 1.05 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', transition: 'all 0.2s' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa' }}>{feature.stat}</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ═══════════ TRENDING LOCATIONS ═══════════ */}
            <section style={{ position: 'relative', zIndex: 1, padding: '80px clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', damping: 20 }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', delay: 0.2 }}
                            style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px', border: '1px solid rgba(245,158,11,0.2)' }}>📍</motion.div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '900', marginBottom: '12px', fontFamily: 'Space Grotesk' }}>
                            Trending <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Locations</span>
                        </h2>
                        <p style={{ fontSize: '16px', color: '#64748b' }}>Most searched areas this month</p>
                    </div>
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                        {trendingLocations.map((loc, i) => (
                            <motion.div key={i} variants={scaleIn}
                                whileHover={{ scale: 1.04, y: -5, boxShadow: '0 16px 40px rgba(0,0,0,0.3)', borderColor: 'rgba(99,179,237,0.3)', background: 'rgba(255,255,255,0.05)' }}
                                onClick={() => navigate('/auth')}
                                style={{ padding: '22px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.4s' }}>
                                <motion.div whileHover={{ rotate: 10 }} style={{ width: '44px', height: '44px', borderRadius: '12px', background: loc.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', flexShrink: 0 }}>📍</motion.div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{loc.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{loc.count} properties</div>
                                </div>
                                <motion.svg animate={{ x: [0, 3, 0] }} transition={{ duration: 2, repeat: Infinity }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M9 18l6-6-6-6" /></motion.svg>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ═══════════ TESTIMONIAL CAROUSEL ═══════════ */}
            <section style={{ position: 'relative', zIndex: 1, padding: '40px clamp(16px, 4vw, 48px) 80px', maxWidth: '900px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', delay: 0.2 }}
                        style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px', border: '1px solid rgba(16,185,129,0.2)' }}>💬</motion.div>
                    <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '900', marginBottom: '12px', fontFamily: 'Space Grotesk' }}>
                        What People <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Say</span>
                    </h2>
                </motion.div>

                <div style={{ position: 'relative', minHeight: '240px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTestimonial}
                            initial={{ opacity: 0, x: 60, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -60, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                            style={{ padding: '40px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)' }} />
                            <p style={{ fontSize: '17px', color: '#cbd5e1', lineHeight: 1.8, fontStyle: 'italic', maxWidth: '660px', margin: '0 auto 24px' }}>
                                "{testimonials[activeTestimonial].quote}"
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: 'white' }}>{testimonials[activeTestimonial].initial}</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{testimonials[activeTestimonial].name}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>{testimonials[activeTestimonial].role}</div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Carousel dots */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
                        {testimonials.map((_, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.2 }}
                                onClick={() => setActiveTestimonial(i)}
                                style={{
                                    width: i === activeTestimonial ? '28px' : '10px',
                                    height: '10px',
                                    borderRadius: '5px',
                                    background: i === activeTestimonial ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.15)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    padding: 0,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ CTA ═══════════ */}
            <section style={{ position: 'relative', zIndex: 1, padding: '40px clamp(16px, 4vw, 48px) 120px', maxWidth: '1100px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ type: 'spring', damping: 18 }}
                    style={{ padding: 'clamp(40px, 6vw, 72px) clamp(24px, 4vw, 48px)', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', animation: 'spin 30s linear infinite' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', delay: 0.3 }}
                            style={{ fontSize: '56px', marginBottom: '20px' }}>🚀</motion.div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '900', marginBottom: '20px', fontFamily: 'Space Grotesk' }}>
                            Ready to Find Your <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Perfect Home?</span>
                        </h2>
                        <p style={{ fontSize: '17px', color: '#94a3b8', marginBottom: '36px', maxWidth: '550px', margin: '0 auto 36px' }}>
                            Join thousands of happy users who found their dream property with EstatePulse
                        </p>
                        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(59,130,246,0.5)' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')}
                                style={{ padding: '16px 44px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: 'white', fontSize: '17px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 16px 40px rgba(59,130,246,0.5)', position: 'relative', overflow: 'hidden' }}>
                                Get Started — It's Free
                                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '200%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/search')}
                                style={{ padding: '16px 44px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '17px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' }}>
                                Browse Properties
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <motion.footer initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{ position: 'relative', zIndex: 1, padding: '32px clamp(16px, 4vw, 48px)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#475569' }}>© 2026 EstatePulse. AI-Powered Real Estate Platform. All rights reserved.</p>
            </motion.footer>

            <style>{`
                @keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -30px); } }
                @keyframes shimmer { 0% { transform: translateX(-50%); } 100% { transform: translateX(50%); } }
                @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 8px rgba(16,185,129,0.4); } 50% { box-shadow: 0 0 20px rgba(16,185,129,0.8); } }
            `}</style>
        </div>
    );
};

export default HomePage;
