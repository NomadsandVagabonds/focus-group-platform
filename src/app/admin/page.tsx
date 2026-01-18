'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [moderatorName, setModeratorName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Mock login handler
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsAuthenticated(true);
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: sessionName || 'Focus Group Session',
                    moderatorId: moderatorName || 'Moderator',
                }),
            });

            if (!response.ok) throw new Error('Failed to create session');

            const session = await response.json();
            router.push(`/moderator?session=${session.id}&user=${encodeURIComponent(moderatorName || 'Moderator')}`);
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logoMark}>R</div>
                <h1 className={styles.logoText}>Resonant</h1>
                <span className={styles.headerTitle}>Moderator Portal</span>
            </header>

            {/* Main content */}
            <main className={styles.main}>
                {!isAuthenticated ? (
                    <div className={styles.card}>
                        <h2 className={styles.title}>Moderator Login</h2>
                        <form onSubmit={handleLogin} className={styles.form}>
                            <div className={styles.field}>
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="admin@resonant.com"
                                    defaultValue="admin@resonant.com" // For convenience during demo
                                />
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    defaultValue="password" // For convenience during demo
                                />
                            </div>
                            <button type="submit" className={styles.primaryBtn}>
                                Login to Dashboard
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className={styles.card}>
                        <h2 className={styles.title}>Create New Session</h2>
                        <form onSubmit={handleCreateSession} className={styles.form}>
                            <div className={styles.field}>
                                <label htmlFor="sessionName">Session Name</label>
                                <input
                                    id="sessionName"
                                    type="text"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    placeholder="e.g., Climate Messaging Study"
                                    autoFocus
                                />
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="moderatorName">Your Name</label>
                                <input
                                    id="moderatorName"
                                    type="text"
                                    value={moderatorName}
                                    onChange={(e) => setModeratorName(e.target.value)}
                                    placeholder="e.g., Dr. Smith"
                                />
                            </div>
                            <button
                                type="submit"
                                className={styles.primaryBtn}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating...' : 'Launch Session'}
                            </button>
                        </form>
                    </div>
                )}

                <Link href="/" className={styles.backLink}>
                    ← Back to Participant Portal
                </Link>
            </main>
        </div>
    );
}
