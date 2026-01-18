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
    const [generatedLinks, setGeneratedLinks] = useState<{ id: string, url: string }[]>([]);

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
                    <>
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

                        <div className={styles.card} style={{ marginTop: '2rem' }}>
                            <h2 className={styles.title}>Bulk Link Generator</h2>
                            <div className={styles.form}>
                                <div className={styles.field}>
                                    <label htmlFor="participantIds">Participant IDs / Names (One per line)</label>
                                    <textarea
                                        id="participantIds"
                                        placeholder="P_101&#10;P_102&#10;Alice&#10;Bob"
                                        rows={5}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(0,0,0,0.2)',
                                            color: 'white',
                                            fontFamily: 'monospace'
                                        }}
                                        onChange={(e) => {
                                            const ids = e.target.value.split('\n').filter(line => line.trim());
                                            const session = sessionName || 'FocusSession';
                                            const links = ids.map(id => {
                                                const cleanId = id.trim();
                                                return {
                                                    id: cleanId,
                                                    url: `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${encodeURIComponent(session)}?p=${encodeURIComponent(cleanId)}`
                                                };
                                            });
                                            setGeneratedLinks(links);
                                        }}
                                    />
                                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                        Base URL: {typeof window !== 'undefined' ? window.location.origin : ''}/join/{sessionName || 'FocusSession'}
                                    </p>
                                </div>

                                {generatedLinks.length > 0 && (
                                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {generatedLinks.map(link => (
                                            <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px' }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '12px' }}>
                                                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{link.id}:</span>
                                                    <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>{link.url}</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(link.url);
                                                        alert(`Copied link for ${link.id}`);
                                                    }}
                                                    className={styles.primaryBtn} // Reusing primary button style but smaller?
                                                    style={{ width: 'auto', padding: '4px 8px', fontSize: '11px', height: 'auto' }}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <Link href="/" className={styles.backLink}>
                    ← Back to Participant Portal
                </Link>
            </main>
        </div>
    );
}
