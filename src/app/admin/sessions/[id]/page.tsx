'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../admin.module.css';
import SessionAnalytics from '@/components/SessionAnalytics';

interface Session {
    id: string;
    name: string;
    code: string;
    status: 'scheduled' | 'live' | 'completed';
    moderator_notes?: string;
    created_at: string;
}

interface Participant {
    id: string;
    code: string;
    name?: string;
    display_name?: string;
    email?: string;
    notes?: string;
    metadata?: { isBackup?: boolean; name?: string };
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [session, setSession] = useState<Session | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newParticipantName, setNewParticipantName] = useState('');

    useEffect(() => {
        fetchSessionData();
    }, [id]);

    const fetchSessionData = async () => {
        try {
            const res = await fetch(`/api/sessions/${id}`);
            if (!res.ok) throw new Error('Session not found');
            const data = await res.json();
            setSession(data.session);
            setParticipants(data.participants || []);
        } catch (error) {
            console.error('Failed to fetch session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addParticipant = async () => {
        if (!newParticipantName.trim()) return;

        try {
            const res = await fetch(`/api/sessions/${id}/participants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participants: [{
                        name: newParticipantName.trim(),
                        display_name: newParticipantName.trim() // Default display name to name
                    }]
                })
            });

            if (res.ok) {
                const data = await res.json();
                setParticipants(prev => [...prev, ...data.participants]);
                setNewParticipantName('');
                setShowAddModal(false);
            }
        } catch (error) {
            console.error('Failed to add participant:', error);
        }
    };

    const copyInviteUrl = (participant: Participant) => {
        const url = `${window.location.origin}/join/${session?.code}?p=${participant.code}`;
        navigator.clipboard.writeText(url);
        alert('Invite link copied!');
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'live': return styles.statusLive;
            case 'completed': return styles.statusCompleted;
            default: return styles.statusScheduled;
        }
    };

    if (isLoading) {
        return <div style={{ color: '#718096' }}>Loading...</div>;
    }

    if (!session) {
        return (
            <div className={styles.emptyState}>
                <h3>Session not found</h3>
                <Link href="/admin" className={styles.primaryBtn}>
                    Back to Sessions
                </Link>
            </div>
        );
    }

    return (
        <>
            <Link href="/admin" className={styles.backLink}>
                ← Back to Sessions
            </Link>

            <div className={styles.detailHeader}>
                <div className={styles.detailHeaderInfo}>
                    <h1>{session.name}</h1>
                    <p>
                        Code: <strong style={{ color: '#9A3324', fontFamily: 'monospace' }}>{session.code}</strong>
                        <span className={`${styles.statusBadge} ${getStatusClass(session.status)}`} style={{ marginLeft: '12px' }}>
                            {session.status}
                        </span>
                    </p>
                </div>
                <button
                    className={styles.primaryBtn}
                    onClick={() => router.push(`/moderator?session=${session.id}&user=Moderator`)}
                >
                    🚀 Launch Session
                </button>
            </div>

            <div className={styles.twoColumn}>
                {/* Participants */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Participants ({participants.length})</h2>
                        <button
                            className={styles.secondaryBtn}
                            onClick={() => setShowAddModal(true)}
                        >
                            + Add
                        </button>
                    </div>

                    {participants.length === 0 ? (
                        <div className={styles.emptyState} style={{ padding: '24px' }}>
                            <p>No participants yet</p>
                            <button
                                className={styles.primaryBtn}
                                onClick={() => setShowAddModal(true)}
                            >
                                + Add Participant
                            </button>
                        </div>
                    ) : (
                        <div className={styles.participantList}>
                            {/* Regular participants first */}
                            {participants.filter(p => !p.metadata?.isBackup).map(p => (
                                <div
                                    key={p.id}
                                    className={styles.participantItem}
                                    onClick={() => router.push(`/admin/participants/${p.id}`)}
                                >
                                    <div className={styles.participantInfo}>
                                        <div className={styles.participantName}>
                                            {p.metadata?.name || p.display_name || 'Participant'}
                                        </div>
                                        <div className={styles.participantCode}>
                                            Code: {p.code}
                                        </div>
                                    </div>
                                    <button
                                        className={styles.copyBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyInviteUrl(p);
                                        }}
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            ))}

                            {/* Backup slots - styled differently */}
                            {participants.filter(p => p.metadata?.isBackup).length > 0 && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0' }}>
                                    <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                        Backup Slots (use if participant code fails)
                                    </div>
                                    {participants.filter(p => p.metadata?.isBackup).map(p => (
                                        <div
                                            key={p.id}
                                            className={styles.participantItem}
                                            onClick={() => router.push(`/admin/participants/${p.id}`)}
                                            style={{ opacity: 0.7, background: '#F7FAFC' }}
                                        >
                                            <div className={styles.participantInfo}>
                                                <div className={styles.participantName}>
                                                    🔄 {p.display_name || p.code}
                                                </div>
                                                <div className={styles.participantCode}>
                                                    Code: {p.code}
                                                </div>
                                            </div>
                                            <button
                                                className={styles.copyBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyInviteUrl(p);
                                                }}
                                            >
                                                Copy Link
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Session Info */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Session Info</h2>

                    <div className={styles.inviteBox}>
                        <label>Join URL</label>
                        <code>{window.location.origin}/join/{session.code}?p=[CODE]</code>
                    </div>

                    <div className={styles.inviteBox} style={{ background: 'rgba(250, 204, 21, 0.1)', borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                        <label style={{ color: '#B7791F' }}>👁️ Observer URL (for clients)</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <code style={{ flex: 1 }}>{window.location.origin}/observer?session={session.id}</code>
                            <button
                                className={styles.copyBtn}
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/observer?session=${session.id}`);
                                    alert('Observer link copied!');
                                }}
                            >
                                Copy
                            </button>
                        </div>
                        <span style={{ fontSize: '11px', color: '#718096', marginTop: '4px', display: 'block' }}>
                            Observers can watch but won't appear on camera
                        </span>
                    </div>

                    <div className={styles.field}>
                        <label>Moderator Notes</label>
                        <textarea
                            placeholder="Add notes about this session..."
                            defaultValue={session.moderator_notes || ''}
                            rows={4}
                        />
                    </div>

                    <button className={styles.secondaryBtn}>
                        Save Notes
                    </button>
                </div>

                {/* Media Library */}
                <div className={styles.card} style={{ marginTop: '16px' }}>
                    <h2 className={styles.cardTitle}>Media Library</h2>
                    <p style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '12px' }}>
                        Upload images, videos, audio, or PDFs to present during the session.
                    </p>
                    <Link
                        href={`/admin/sessions/${id}/media`}
                        className={styles.primaryBtn}
                        style={{ display: 'inline-block', textDecoration: 'none' }}
                    >
                        📁 Manage Media
                    </Link>
                </div>

                {/* Script Editor - Coming Soon */}
                <div className={styles.card} style={{ marginTop: '16px' }}>
                    <h2 className={styles.cardTitle}>Session Script</h2>
                    <p style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '12px' }}>
                        Create sections with estimated times and link to media items.
                    </p>
                    <Link
                        href={`/admin/sessions/${id}/script`}
                        className={styles.secondaryBtn}
                        style={{ display: 'inline-block', textDecoration: 'none' }}
                    >
                        📝 Edit Script
                    </Link>
                </div>
            </div>

            {/* Session Analytics */}
            <div className={styles.card} style={{ marginTop: '20px' }}>
                <SessionAnalytics sessionId={session.id} />
            </div>

            {/* Add Participant Modal */}
            {
                showAddModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div className={styles.card} style={{ maxWidth: '400px', margin: '20px' }}>
                            <h2 className={styles.cardTitle}>Add Participant</h2>

                            <div className={styles.field}>
                                <label>Participant Name</label>
                                <input
                                    type="text"
                                    value={newParticipantName}
                                    onChange={(e) => setNewParticipantName(e.target.value)}
                                    placeholder="e.g., Margaret Johnson"
                                    autoFocus
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className={styles.primaryBtn} onClick={addParticipant}>
                                    Add Participant
                                </button>
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
