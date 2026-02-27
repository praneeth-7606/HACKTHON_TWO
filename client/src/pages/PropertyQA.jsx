import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const PropertyQA = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const propertyId = searchParams.get('propertyId');
    
    const [user, setUser] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const messagesEndRef = useRef(null);
    
    useEffect(() => {
        const loadData = async () => {
            try {
                const userRes = await api.get('/users/me');
                setUser(userRes.data.data.user);
                
                if (!propertyId) {
                    console.error('No propertyId provided');
                    alert('Property ID is missing. Redirecting to dashboard.');
                    navigate('/seller');
                    return;
                }
                
                console.log('[PropertyQA] Loading questions for property:', propertyId);
                
                // Generate questions
                const qaRes = await api.post(`/qa/generate/${propertyId}`);
                console.log('[PropertyQA] Questions received:', qaRes.data.data.questions);
                
                if (qaRes.data.data.questions && qaRes.data.data.questions.length > 0) {
                    setQuestions(qaRes.data.data.questions);
                    setLoading(false);
                } else {
                    console.error('No questions generated');
                    alert('Failed to generate questions. Please try again.');
                    setLoading(false);
                }
                
            } catch (err) {
                console.error('[PropertyQA] Error loading questions:', err);
                alert(`Failed to load questions: ${err.response?.data?.message || err.message}`);
                setLoading(false);
                // Don't navigate away on error - let user retry
            }
        };
        
        loadData();
    }, [propertyId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentIndex]);
    
    const handleSubmit = async (skipQuestion = false) => {
        setSubmitting(true);
        
        try {
            // Submit answer (or null if skipped)
            await api.post(`/qa/answer/${propertyId}`, {
                questionIndex: currentIndex,
                answer: skipQuestion ? null : answer.trim()
            });
            
            // Move to next question
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setAnswer('');
            } else {
                // All questions done
                await api.post(`/qa/complete/${propertyId}`);
                setCompleted(true);
            }
            
        } catch (err) {
            console.error('Error submitting answer:', err);
            alert('Failed to submit answer. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    const handleFinish = () => {
        navigate('/seller');
    };
    
    if (loading) {
        return (
            <div style={{ background: '#020817', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p>Generating questions...</p>
                </div>
            </div>
        );
    }
    
    if (completed) {
        const answeredCount = questions.filter((_, i) => i < currentIndex + 1).length;
        
        return (
            <div style={{ background: '#020817', minHeight: '100vh', color: 'white' }}>
                <Navbar user={user} />
                
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.6 }}
                    >
                        <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎉</div>
                        <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px', fontFamily: 'Space Grotesk' }}>
                            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Great Job!
                            </span>
                        </h1>
                        <p style={{ fontSize: '20px', color: '#94a3b8', marginBottom: '32px' }}>
                            You answered {answeredCount} out of {questions.length} questions
                        </p>
                        
                        <div style={{
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: '20px',
                            padding: '32px',
                            marginBottom: '40px'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '16px' }}>✨</div>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                                Your Property is Now Live!
                            </h3>
                            <p style={{ color: '#6ee7b7', lineHeight: '1.7' }}>
                                Your answers will help buyers make informed decisions and reduce unnecessary questions. 
                                This increases your chances of finding serious buyers faster!
                            </p>
                        </div>
                        
                        <button
                            onClick={handleFinish}
                            style={{
                                padding: '16px 40px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                border: 'none',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 8px 24px rgba(59,130,246,0.4)'
                            }}
                        >
                            Go to Dashboard
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }
    
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    
    return (
        <div style={{ background: '#020817', minHeight: '100vh', color: 'white' }}>
            <Navbar user={user} />
            
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '40px', textAlign: 'center' }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 20px',
                        borderRadius: '999px',
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        marginBottom: '20px'
                    }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#60a5fa' }}>
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                    </div>
                    
                    <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '12px', fontFamily: 'Space Grotesk' }}>
                        Help Buyers Know Your Property Better
                    </h1>
                    <p style={{ fontSize: '16px', color: '#94a3b8' }}>
                        Answer a few questions that buyers typically ask. You can skip any question.
                    </p>
                </motion.div>
                
                {/* Progress Bar */}
                <div style={{
                    height: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '999px',
                    marginBottom: '48px',
                    overflow: 'hidden'
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                            borderRadius: '999px'
                        }}
                    />
                </div>
                
                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: 'rgba(15,23,42,0.6)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '40px',
                            backdropFilter: 'blur(20px)',
                            marginBottom: '32px'
                        }}
                    >
                        {/* Category Badge */}
                        <div style={{
                            display: 'inline-block',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#a5b4fc',
                            marginBottom: '20px'
                        }}>
                            {currentQuestion.category}
                        </div>
                        
                        {/* Question */}
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            lineHeight: '1.4',
                            marginBottom: '32px',
                            color: 'white'
                        }}>
                            {currentQuestion.question}
                        </h2>
                        
                        {/* Answer Input */}
                        <textarea
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            placeholder="Type your answer here... (or skip if you prefer not to answer)"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                minHeight: '150px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '20px',
                                color: 'white',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'Inter'
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </motion.div>
                </AnimatePresence>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={submitting}
                        style={{
                            padding: '14px 32px',
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#94a3b8',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.5 : 1
                        }}
                    >
                        Skip Question
                    </button>
                    
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={submitting || !answer.trim()}
                        style={{
                            padding: '14px 40px',
                            borderRadius: '14px',
                            background: (submitting || !answer.trim()) ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            border: 'none',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: (submitting || !answer.trim()) ? 'not-allowed' : 'pointer',
                            boxShadow: (submitting || !answer.trim()) ? 'none' : '0 8px 24px rgba(59,130,246,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {submitting ? (
                            <>
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.6s linear infinite' }} />
                                Submitting...
                            </>
                        ) : (
                            <>
                                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish'} →
                            </>
                        )}
                    </button>
                </div>
                
                <div ref={messagesEndRef} />
            </div>
            
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PropertyQA;
