'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './admin.module.css';

interface AdminLayoutClientProps {
    children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check authentication status on mount
    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/admin-auth');
                setIsAuthenticated(res.ok);
            } catch {
                setIsAuthenticated(false);
            }
        }
        checkAuth();
    }, []);

    // Handle login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                setIsAuthenticated(true);
            } else {
                const data = await res.json();
                setError(data.error || 'Invalid password');
            }
        } catch {
            setError('Connection error');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        await fetch('/api/admin-auth', { method: 'DELETE' });
        setIsAuthenticated(false);
        setPassword('');
    };

    const navItems = [
        { href: '/admin', label: 'Sessions', icon: '📋' },
        { href: '/admin/data', label: 'Data', icon: '📊' },
        { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ];

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin' || pathname?.startsWith('/admin/sessions');
        }
        return pathname?.startsWith(href);
    };

    // Loading state
    if (isAuthenticated === null) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#f8fafc'
            }}>
                <p style={{ color: '#64748b' }}>Loading...</p>
            </div>
        );
    }

    // Login form
    if (!isAuthenticated) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#F5F0E8'
            }}>
                <div style={{
                    background: 'white',
                    padding: '2.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: '#9A3324',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: 'white'
                        }}>
                            R
                        </div>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#1A1A2E',
                            marginBottom: '0.5rem'
                        }}>
                            Resonant Admin
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                            Enter your password to continue
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Admin password"
                                required
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                background: '#FEE2E2',
                                border: '1px solid #FCA5A5',
                                borderRadius: '6px',
                                color: '#991B1B',
                                fontSize: '0.875rem',
                                marginBottom: '1rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                background: '#9A3324',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Verifying...' : 'Login'}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link href="/" style={{ color: '#64748b', fontSize: '0.875rem', textDecoration: 'none' }}>
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoMark}>R</div>
                    <span className={styles.logoTextSmall}>Resonant</span>
                </div>

                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.5rem 1rem',
                            marginBottom: '0.5rem',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            textAlign: 'left'
                        }}
                    >
                        Logout
                    </button>
                    <Link href="/" className={styles.backToApp}>
                        ← Back to App
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
