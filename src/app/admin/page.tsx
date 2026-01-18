'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';

interface Session {
    id: string;
    name: string;
    code: string;
    status: 'scheduled' | 'live' | 'completed';
    moderator_notes?: string;
    scheduled_at?: string;
    created_at: string;
}

interface Participant {
    id: string;
    code: string;
    display_name?: string;
    email?: string;
    notes?: string;
    inviteUrl?: string;
}

// Expandable participant card with notes editor
function ParticipantCard({
    participant,
    onUpdate
}: {
    participant: Participant;
    onUpdate: (updated: Partial<Participant>) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [notes, setNotes] = useState(participant.notes || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/participants/${participant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });
            if (res.ok) {
                onUpdate({ id: participant.id, notes });
            }
        } catch (error) {
            console.error('Failed to save notes:', error);
        }
        setIsSaving(false);
    };

    return (
        <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Header - clickable to expand */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    cursor: 'pointer'
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
                        {participant.email || participant.display_name || 'Participant'}
                        {participant.notes && <span style={{ color: '#f59e0b', fontSize: '10px' }}>📝</span>}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace', marginLeft: '20px' }}>
                        Code: {participant.code}
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(participant.inviteUrl || '');
                        alert(`Link copied for ${participant.email || participant.code}`);
                    }}
                    style={{
                        background: 'var(--color-accent-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                    }}
                >
                    Copy Link
                </button>
            </div>

            {/* Expandable notes section */}
            {isExpanded && (
                <div style={{
                    padding: '0 14px 14px 14px',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <label style={{
                        display: 'block',
                        fontSize: '11px',
                        color: '#94a3b8',
                        marginTop: '12px',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Moderator Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this participant (background, talking points, etc.)"
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'white',
                            fontSize: '12px',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button
                            onClick={handleSaveNotes}
                            disabled={isSaving || notes === (participant.notes || '')}
                            style={{
                                background: notes !== (participant.notes || '') ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: notes !== (participant.notes || '') ? 'pointer' : 'default',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            {isSaving ? 'Saving...' : 'Save Notes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Create session form
    const [sessionName, setSessionName] = useState('');
    const [moderatorName, setModeratorName] = useState('');
    const [participantEmails, setParticipantEmails] = useState('');

    // View state
    const [activeView, setActiveView] = useState<'list' | 'create' | 'session'>('list');
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [sessionParticipants, setSessionParticipants] = useState<Participant[]>([]);

    // Fetch sessions on auth
    useEffect(() => {
        if (isAuthenticated) {
            fetchSessions();
        }
    }, [isAuthenticated]);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/sessions');
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsAuthenticated(true);
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Parse participant emails/identifiers
            const participantList = participantEmails
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => {
                    // Support comma-separated format: email, notes
                    const parts = line.split(',').map(p => p.trim());
                    return {
                        email: parts[0] || null,
                        notes: parts[1] || null
                    };
                });

            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: sessionName || 'Focus Group Session',
                    moderatorNotes: `Created by ${moderatorName || 'Admin'}`,
                    participants: participantList.length > 0 ? participantList : undefined
                }),
            });

            if (!response.ok) throw new Error('Failed to create session');

            const { session, participants } = await response.json();

            // Show the new session with invite links
            setSelectedSession(session);
            setSessionParticipants(participants.map((p: Participant) => ({
                ...p,
                inviteUrl: `${window.location.origin}/join/${session.code}?p=${p.code}`
            })));
            setActiveView('session');

            // Refresh sessions list
            fetchSessions();

            // Clear form
            setSessionName('');
            setParticipantEmails('');

        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const viewSession = async (session: Session) => {
        setSelectedSession(session);

        // Fetch participants
        try {
            const res = await fetch(`/api/sessions/${session.id}/participants`);
            const data = await res.json();
            setSessionParticipants((data.participants || []).map((p: Participant) => ({
                ...p,
                inviteUrl: `${window.location.origin}/join/${session.code}?p=${p.code}`
            })));
        } catch (error) {
            console.error('Failed to fetch participants:', error);
        }

        setActiveView('session');
    };

    const launchSession = (session: Session) => {
        router.push(`/moderator?session=${session.id}&user=${encodeURIComponent(moderatorName || 'Moderator')}`);
    };

    const addParticipants = async () => {
        if (!selectedSession) return;

        const newEmails = prompt('Enter participant emails/identifiers (one per line):');
        if (!newEmails) return;

        const participants = newEmails.split('\n').map(line => ({
            email: line.trim() || null
        })).filter(p => p.email);

        try {
            const res = await fetch(`/api/sessions/${selectedSession.id}/participants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participants })
            });

            if (!res.ok) throw new Error('Failed to add participants');

            const data = await res.json();
            setSessionParticipants(prev => [...prev, ...data.participants.map((p: Participant) => ({
                ...p,
                inviteUrl: `${window.location.origin}/join/${selectedSession.code}?p=${p.code}`
            }))]);
        } catch (error) {
            alert('Failed to add participants');
        }
    };

    const copyAllLinks = () => {
        const links = sessionParticipants.map(p => `${p.email || p.code}: ${p.inviteUrl}`).join('\n');
        navigator.clipboard.writeText(links);
        alert('All invite links copied to clipboard!');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live': return '#22c55e';
            case 'completed': return '#6b7280';
            default: return '#f59e0b';
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logoMark}>R</div>
                <h1 className={styles.logoText}>Resonant</h1>
                <span className={styles.headerTitle}>Admin Portal</span>
            </header>

            {/* Main content */}
            <main className={styles.main}>
                {!isAuthenticated ? (
                    <div className={styles.card}>
                        <h2 className={styles.title}>Admin Login</h2>
                        <form onSubmit={handleLogin} className={styles.form}>
                            <div className={styles.field}>
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="admin@resonant.com"
                                    defaultValue="admin@resonant.com"
                                />
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    defaultValue="password"
                                />
                            </div>
                            <button type="submit" className={styles.primaryBtn}>
                                Login to Dashboard
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        {/* Navigation Tabs */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                onClick={() => setActiveView('list')}
                                className={styles.primaryBtn}
                                style={{
                                    background: activeView === 'list' ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.1)',
                                    flex: 1
                                }}
                            >
                                📋 Sessions
                            </button>
                            <button
                                onClick={() => setActiveView('create')}
                                className={styles.primaryBtn}
                                style={{
                                    background: activeView === 'create' ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.1)',
                                    flex: 1
                                }}
                            >
                                ➕ New Session
                            </button>
                        </div>

                        {/* Sessions List View */}
                        {activeView === 'list' && (
                            <div className={styles.card}>
                                <h2 className={styles.title}>Your Sessions</h2>
                                {sessions.length === 0 ? (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                        No sessions yet. Create your first one!
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {sessions.map(session => (
                                            <div
                                                key={session.id}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '8px',
                                                    padding: '1rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => viewSession(session)}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                                                        {session.name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                        Code: <strong style={{ color: 'var(--color-accent-primary)' }}>{session.code}</strong>
                                                        <span style={{
                                                            marginLeft: '1rem',
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            background: getStatusColor(session.status),
                                                            color: 'white',
                                                            fontSize: '10px',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {session.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); launchSession(session); }}
                                                    className={styles.primaryBtn}
                                                    style={{ width: 'auto', padding: '8px 16px' }}
                                                >
                                                    🚀 Launch
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Create Session View */}
                        {activeView === 'create' && (
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
                                    <div className={styles.field}>
                                        <label htmlFor="participants">Participants (Optional - one per line)</label>
                                        <textarea
                                            id="participants"
                                            placeholder="alice@example.com, Alice&#10;bob@example.com, Bob&#10;participant3@example.com"
                                            value={participantEmails}
                                            onChange={(e) => setParticipantEmails(e.target.value)}
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
                                        />
                                        <small style={{ color: '#64748b', fontSize: '11px' }}>
                                            Format: email or email, notes (comma-separated)
                                        </small>
                                    </div>
                                    <button
                                        type="submit"
                                        className={styles.primaryBtn}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Session & Generate Codes'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Session Detail View */}
                        {activeView === 'session' && selectedSession && (
                            <div className={styles.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div>
                                        <h2 className={styles.title} style={{ marginBottom: '4px' }}>{selectedSession.name}</h2>
                                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                                            Session Code: <strong style={{ color: 'var(--color-accent-primary)' }}>{selectedSession.code}</strong>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => launchSession(selectedSession)}
                                        className={styles.primaryBtn}
                                        style={{ width: 'auto' }}
                                    >
                                        🚀 Launch Moderator View
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <button onClick={addParticipants} className={styles.primaryBtn} style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>
                                        ➕ Add Participants
                                    </button>
                                    <button onClick={copyAllLinks} className={styles.primaryBtn} style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>
                                        📋 Copy All Links
                                    </button>
                                </div>

                                <h3 style={{ color: 'white', fontSize: '14px', marginBottom: '0.75rem' }}>
                                    Participants ({sessionParticipants.length})
                                </h3>

                                {sessionParticipants.length === 0 ? (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                                        No participants yet. Add some above!
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                        {sessionParticipants.map(p => (
                                            <ParticipantCard
                                                key={p.id}
                                                participant={p}
                                                onUpdate={(updated) => {
                                                    setSessionParticipants(prev =>
                                                        prev.map(x => x.id === updated.id ? { ...x, ...updated } : x)
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => setActiveView('list')}
                                    style={{
                                        marginTop: '1.5rem',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                    }}
                                >
                                    ← Back to Sessions
                                </button>
                            </div>
                        )}
                    </>
                )}

                <Link href="/" className={styles.backLink}>
                    ← Back to Participant Portal
                </Link>
            </main>
        </div>
    );
}
