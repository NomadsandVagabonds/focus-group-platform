'use client';

import React, { useState, useEffect, use, useRef } from 'react';
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

interface Document {
    name: string;
    size: number;
    createdAt: string;
    url: string;
}

export default function ParticipantDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [participant, setParticipant] = useState<Participant | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Editable fields
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [summaryNotes, setSummaryNotes] = useState('');
    const [fullNotes, setFullNotes] = useState('');

    // Documents
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchParticipantData();
    }, [id]);

    const fetchParticipantData = async () => {
        try {
            const sessionsRes = await fetch('/api/sessions');
            const sessionsData = await sessionsRes.json();

            for (const sess of sessionsData.sessions || []) {
                const sessionRes = await fetch(`/api/sessions/${sess.id}`);
                const sessionData = await sessionRes.json();

                const found = sessionData.participants?.find((p: Participant) => p.id === id);
                if (found) {
                    setParticipant(found);
                    setSession(sessionData.session);
                    setName(found.metadata?.name as string || '');
                    setDisplayName(found.display_name || '');
                    setEmail(found.email || '');
                    setSummaryNotes(found.notes || '');
                    setFullNotes(found.metadata?.fullNotes as string || '');

                    // Fetch documents
                    fetchDocuments(found.id);
                    break;
                }
            }
        } catch (error) {
            console.error('Failed to fetch participant:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDocuments = async (participantId: string) => {
        try {
            const res = await fetch(`/api/participants/${participantId}/documents`);
            const data = await res.json();
            setDocuments(data.documents || []);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !participant) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`/api/participants/${participant.id}/documents`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                fetchDocuments(participant.id);
            } else {
                alert('Failed to upload file. Make sure Supabase Storage is configured.');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteDocument = async (fileName: string) => {
        if (!participant || !confirm(`Delete ${fileName}?`)) return;

        try {
            await fetch(`/api/participants/${participant.id}/documents`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName })
            });
            setDocuments(prev => prev.filter(d => d.name !== fileName));
        } catch (error) {
            console.error('Delete failed:', error);
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
                    metadata: { name, fullNotes }
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

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
                    <h1>{name || displayName || 'Participant'}</h1>
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
                            <label>Name (Legal)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full legal name"
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="How they appear in session (e.g., Maggie)"
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Email (Optional)</label>
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

            {/* Documents Section */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Documents</h2>
                    <label className={styles.secondaryBtn} style={{ cursor: 'pointer' }}>
                        {isUploading ? 'Uploading...' : '📎 Upload File'}
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                            disabled={isUploading}
                        />
                    </label>
                </div>
                <p style={{ fontSize: '13px', color: '#718096', marginBottom: '16px' }}>
                    Upload survey data, consent forms, or other participant documents.
                </p>

                {documents.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#718096' }}>
                        No documents uploaded yet
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {documents.map(doc => (
                            <div
                                key={doc.name}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: '#F7FAFC',
                                    borderRadius: '8px'
                                }}
                            >
                                <div>
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#9A3324', fontWeight: 500, textDecoration: 'none' }}
                                    >
                                        📄 {doc.name}
                                    </a>
                                    {doc.size > 0 && (
                                        <span style={{ marginLeft: '12px', color: '#718096', fontSize: '12px' }}>
                                            {formatFileSize(doc.size)}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteDocument(doc.name)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#9A3324',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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

