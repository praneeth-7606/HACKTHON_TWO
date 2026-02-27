import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    // Type configurations
    const typeConfig = {
        success: {
            gradient: 'linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(5,150,105,0.95) 100%)',
            icon: '✓',
            title: 'Success'
        },
        error: {
            gradient: 'linear-gradient(135deg, rgba(239,68,68,0.95) 0%, rgba(220,38,38,0.95) 100%)',
            icon: '✕',
            title: 'Error'
        },
        info: {
            gradient: 'linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(139,92,246,0.95) 100%)',
            icon: '💬',
            title: 'New Message'
        },
        warning: {
            gradient: 'linear-gradient(135deg, rgba(245,158,11,0.95) 0%, rgba(217,119,6,0.95) 100%)',
            icon: '⚠',
            title: 'Warning'
        }
    };

    const config = typeConfig[type] || typeConfig.info;

    // Handle message object (for new messages) or string
    const isMessageObject = typeof message === 'object' && message.sender;
    const displayMessage = isMessageObject 
        ? `${message.sender?.name || 'Someone'} sent you a message`
        : message;

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
                position: 'fixed',
                top: '80px',
                right: '20px',
                zIndex: 9999,
                background: config.gradient,
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '16px 20px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                minWidth: '320px',
                maxWidth: '400px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}
        >
            <div style={{ 
                fontSize: '24px',
                flexShrink: 0
            }}>
                {config.icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ 
                    fontSize: '13px', 
                    fontWeight: '800', 
                    color: 'white',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {config.title}
                </div>
                <div style={{ 
                    fontSize: '14px', 
                    color: 'rgba(255,255,255,0.95)',
                    lineHeight: '1.4'
                }}>
                    {displayMessage}
                </div>
                {isMessageObject && message.propertyId?.title && (
                    <div style={{ 
                        fontSize: '11px', 
                        color: 'rgba(255,255,255,0.7)',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span>🏡</span> {message.propertyId.title}
                    </div>
                )}
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '16px',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
                ×
            </button>
        </motion.div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <AnimatePresence>
            {toasts.map((toast, index) => (
                <div key={toast.id} style={{ position: 'fixed', top: `${80 + index * 100}px`, right: '20px', zIndex: 9999 }}>
                    <Toast
                        message={toast.message}
                        type={toast.type || 'info'}
                        onClose={() => removeToast(toast.id)}
                        duration={toast.duration}
                    />
                </div>
            ))}
        </AnimatePresence>
    );
};

export default Toast;
