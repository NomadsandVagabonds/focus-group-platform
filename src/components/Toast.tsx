'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: Toast['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a no-op if used outside provider
        return { showToast: () => { } };
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((
        message: string,
        type: Toast['type'] = 'info',
        duration: number = 4000
    ) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getTypeStyles = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return { background: '#10b981', icon: '✓' };
            case 'warning':
                return { background: '#f59e0b', icon: '⚠' };
            case 'error':
                return { background: '#ef4444', icon: '✕' };
            default:
                return { background: '#3b82f6', icon: 'ℹ' };
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxWidth: '350px'
            }}>
                {toasts.map(toast => {
                    const typeStyles = getTypeStyles(toast.type);
                    return (
                        <div
                            key={toast.id}
                            style={{
                                background: typeStyles.background,
                                color: 'white',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                animation: 'slideIn 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onClick={() => removeToast(toast.id)}
                        >
                            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                {typeStyles.icon}
                            </span>
                            <span style={{ fontSize: '14px', flex: 1 }}>
                                {toast.message}
                            </span>
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
