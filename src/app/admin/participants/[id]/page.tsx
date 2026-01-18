'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../admin.module.css';

interface Participant {
    id: string;
    session_id: string;
    code: string;
    display_name?: string;
    email?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

interface Session {
    id: string;
    name: string;
    code: string;
}

export default function ParticipantDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [participant, setParticipant] = useState<Participant | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Editable fields
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [summaryNotes, setSummaryNotes] = useState('');
    const [fullNotes, setFullNotes] = useState('');

    useEffect(() => {
        fetchParticipantData();
    }, [id]);

    const fetchParticipantData = async () => {
        try {
            // We need an API to get a single participant
            // For now, we'll search through sessions
            const sessionsRes = await fetch('/api/sessions');
            const sessionsData = await sessionsRes.json();

            for (const sess of sessionsData.sessions || []) {
                const sessionRes = await fetch(`/api/sessions/${sess.id}`);
                const sessionData = await sessionRes.json();

                const found = sessionData.participants?.find((p: Participant) => p.id === id);
                if (found) {
                    setParticipant(found);
                    setSession(sessionData.session);
                    setDisplayName(found.display_name || '');
                    setEmail(found.email || '');
                    setSummaryNotes(found.notes || '');
                    setFullNotes(found.metadata?.fullNotes as string || '');
                    break;
                }
            }
        } catch (error) {
            console.error('Failed to fetch participant:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!participant) return;
        setIsSaving(true);

        try {
            const res = await fetch(`/api/participants/${participant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName,
                    email,
                    notes: summaryNotes,
                    metadata: { fullNotes }
                })
            });

            if (res.ok) {
                alert('Saved successfully!');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const copyCode = () => {
        if (participant) {
            navigator.clipboard.writeText(participant.code);
            alert('Code copied!');
        }
    };

    const copyInviteUrl = () => {
        if (participant && session) {
            const url = `${window.location.origin}/join/${session.code}?p=${participant.code}`;
            navigator.clipboard.writeText(url);
            alert('Invite URL copied!');
        }
    };

    if (isLoading) {
        return <div style={{ color: '#718096' }}>Loading...</div>;
    }

    if (!participant) {
        return (
            <div className={styles.emptyState}>
                <h3>Participant not found</h3>
                <Link href="/admin" className={styles.primaryBtn}>
                    Back to Sessions
                </Link>
            </div>
        );
    }

    return (
        <>
            {session && (
                <Link href={`/admin/sessions/${session.id}`} className={styles.backLink}>
                    ← Back to {session.name}
                </Link>
            )}

            <div className={styles.detailHeader}>
                <div className={styles.detailHeaderInfo}>
                    <h1>{displayName || email || 'Participant'}</h1>
                    <p>Code: <strong style={{ color: '#9A3324', fontFamily: 'monospace' }}>{participant.code}</strong></p>
                </div>
                <button className={styles.primaryBtn} onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : '💾 Save Changes'}
                </button>
            </div>

            <div className={styles.twoColumn}>
                {/* Left Column - Basic Info */}
                <div>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Basic Information</h2>

                        <div className={styles.field}>
                            <label>Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="How they appear in session"
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="participant@example.com"
                            />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Invite Details</h2>

                        <div className={styles.inviteBox}>
                            <label>Unique Code</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <code style={{ flex: 1 }}>{participant.code}</code>
                                <button className={styles.copyBtn} onClick={copyCode}>Copy</button>
                            </div>
                        </div>

                        <div className={styles.inviteBox}>
                            <label>Invite URL</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <code style={{ flex: 1, fontSize: '12px' }}>
                                    {window.location.origin}/join/{session?.code}?p={participant.code}
                                </code>
                                <button className={styles.copyBtn} onClick={copyInviteUrl}>Copy</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Notes */}
                <div>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Summary Notes</h2>
                        <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px' }}>
                            These notes appear in the moderator accordion during live sessions.
                        </p>
                        <div className={styles.field} style={{ marginBottom: 0 }}>
                            <textarea
                                value={summaryNotes}
                                onChange={(e) => setSummaryNotes(e.target.value)}
                                placeholder="Brief notes visible during session..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Full Notes</h2>
                        <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px' }}>
                            Detailed background information, not shown during live session.
                        </p>
                        <div className={styles.field} style={{ marginBottom: 0 }}>
                            <textarea
                                value={fullNotes}
                                onChange={(e) => setFullNotes(e.target.value)}
                                placeholder="Detailed participant background, demographics, previous participation, etc..."
                                rows={8}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating Data Section */}
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Rating Data</h2>
                <div className={styles.emptyState} style={{ padding: '24px' }}>
                    <p style={{ color: '#718096' }}>
                        Rating data will appear here after the participant joins a live session.
                    </p>
                </div>
            </div>
        </>
    );
}
