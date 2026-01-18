'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import styles from '../../page.module.css'; // Reuse the same styles

function JoinSessionContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const sessionCode = params.sessionCode as string;
    const initialParticipantId = searchParams.get('p') || '';

    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName) return;

        setIsLoading(true);

        // Simulate joining flow
        setTimeout(() => {
            // Redirect to the actual participant room (existing route)
            // In production this would do a proper auth handshake first
            const userParam = encodeURIComponent(displayName);
            const sessionParam = encodeURIComponent(sessionCode);

            router.push(`/participant?session=${sessionParam}&user=${userParam}`);
        }, 800);
    };

    return (
        <div className={styles.container}>
            <div className={styles.backgroundLayer} />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.brand}>
                    <div className={styles.logoMark}>R</div>
                    <h1 className={styles.logoText}>Resonant</h1>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.contentWrapper}>
                    <div className={styles.card}>
                        <div style={{ padding: '2.5rem 2rem', textAlign: 'center', borderBottom: '1px solid #E2E8F0' }}>
                            <h2 style={{ fontSize: '1.25rem', fontFamily: 'Georgia, serif', color: '#1A1A2E', margin: '0 0 0.5rem 0' }}>Almost there</h2>
                            <p style={{ color: '#4A5568', margin: 0, fontSize: '0.9rem' }}>
                                Joining session <strong>{sessionCode}</strong>
                                {initialParticipantId && <span> as <code>{initialParticipantId}</code></span>}
                            </p>
                        </div>

                        <form onSubmit={handleJoin} className={styles.formPanel}>
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="display-name">Display Name</label>
                                <input
                                    id="display-name"
                                    type="text"
                                    className={styles.input}
                                    placeholder="What should we call you?"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    autoFocus
                                    required
                                />
                                <p className={styles.helperText}>
                                    This is how you will appear to the moderator and other participants.
                                </p>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                {isLoading ? 'Connecting...' : 'Join Session →'}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    ← Go Back
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <p className={styles.copyright}>© 2026 Resonant Research Tools.</p>
            </footer>
        </div>
    );
}

export default function JoinSessionPage() {
    return (
        <Suspense fallback={<div>Loading Details...</div>}>
            <JoinSessionContent />
        </Suspense>
    );
}
