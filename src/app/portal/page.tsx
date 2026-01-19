'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

function RedesignContent() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');

    // Join Session State
    const [sessionCode, setSessionCode] = useState('');
    const [participantId, setParticipantId] = useState('');

    // Create Session State
    const [newSessionName, setNewSessionName] = useState('');
    const [moderatorName, setModeratorName] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleJoinNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionCode) return;

        setIsLoading(true);

        // Simulate validation delay for "institutional" feel
        setTimeout(() => {
            // In a real app, we would validate the code here.
            // For now, redirect to the 'Almost there' page (Path B flow)
            // We pass the session code to the dynamic route

            const code = sessionCode.trim().toUpperCase();
            const pId = participantId.trim();

            // This route is in [sessionCode] folder at the redesign root level presumably?
            // Wait, the file structure is src/app/join/[sessionCode]/page.tsx
            // So the URL is /join/CODE

            let url = `/join/${code}`;
            if (pId) {
                url += `?p=${encodeURIComponent(pId)}`;
            }

            router.push(url);
        }, 600);
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newSessionName || 'Focus Group Session',
                    moderatorId: moderatorName || 'Principal Investigator',
                }),
            });

            const session = await response.json();

            // Redirect to moderator view (using existing production route for now)
            router.push(`/moderator?session=${session.id}&user=${encodeURIComponent(moderatorName || 'Principal Investigator')}`);
        } catch (error) {
            console.error("Failed to create session", error);
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.backgroundLayer} />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.brand}>
                    <img src="/logo.png" alt="R" className={styles.logoMark} />
                    <h1 className={styles.logoText}>Resonant</h1>
                </div>
                <nav className={styles.nav}>
                    {/* Link back to marketing site */}
                    <a href="/" className={styles.navLink} style={{ marginRight: '20px' }}>← Home</a>
                </nav>
            </header>

            {/* Main Board */}
            <main className={styles.main}>
                <div className={styles.contentWrapper}>
                    <h2 className={styles.heading}>Session Portal</h2>
                    <p className={styles.subHeading}>
                        Secure entry for authorized moderators and participants.
                    </p>

                    <div className={styles.card}>
                        {/* Tabs */}
                        <div className={styles.tabHeader}>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'join' ? styles.active : ''}`}
                                onClick={() => setActiveTab('join')}
                            >
                                Join Session
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'create' ? styles.active : ''}`}
                                onClick={() => setActiveTab('create')}
                            >
                                Create Session
                            </button>
                        </div>

                        {/* Join Tab */}
                        {activeTab === 'join' && (
                            <form onSubmit={handleJoinNext} className={styles.formPanel}>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="session-code">Session Code</label>
                                    <input
                                        id="session-code"
                                        type="text"
                                        className={styles.input}
                                        placeholder="e.g. CLIMATE2026"
                                        value={sessionCode}
                                        onChange={(e) => setSessionCode(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="participant-id">Participant ID (Optional)</label>
                                    <input
                                        id="participant-id"
                                        type="text"
                                        className={styles.input}
                                        placeholder="e.g. P-7294"
                                        value={participantId}
                                        onChange={(e) => setParticipantId(e.target.value)}
                                    />
                                    <p className={styles.helperText}>
                                        If you received an invitation email, your ID is included in the link.
                                    </p>
                                </div>
                                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                    {isLoading ? 'Verifying...' : 'Continue →'}
                                </button>
                            </form>
                        )}

                        {/* Create Tab */}
                        {activeTab === 'create' && (
                            <form onSubmit={handleCreateSession} className={styles.formPanel}>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="session-name">Study Name</label>
                                    <input
                                        id="session-name"
                                        type="text"
                                        className={styles.input}
                                        placeholder="e.g. Q1 Consumer Sentiment"
                                        value={newSessionName}
                                        onChange={(e) => setNewSessionName(e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="moderator-name">Moderator Name</label>
                                    <input
                                        id="moderator-name"
                                        type="text"
                                        className={styles.input}
                                        placeholder="e.g. Dr. Roberts"
                                        value={moderatorName}
                                        onChange={(e) => setModeratorName(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                    {isLoading ? 'Initializing...' : 'Initialize Session'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <p className={styles.copyright}>© 2026 Resonant Research Tools. Institutional Use Only.</p>
            </footer>
        </div>
    );
}

export default function RedesignPortalPage() {
    return (
        <Suspense fallback={<div>Loading Portal...</div>}>
            <RedesignContent />
        </Suspense>
    );
}
