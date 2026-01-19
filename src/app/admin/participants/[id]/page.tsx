'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import styles from '../../admin.module.css';
import ParticipantRatingData from '@/components/ParticipantRatingData';

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

interface Tag {
    id: string;
    name: string;
    color: string;
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

    // Tags
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [participantTags, setParticipantTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    useEffect(() => {
        fetchParticipantData();
        fetchAllTags();
    }, [id]);

    const fetchAllTags = async () => {
        try {
            const res = await fetch('/api/tags');
            const data = await res.json();
            setAllTags(data || []);
        } catch (error) {
            console.error('Failed to fetch tags:', error);
        }
    };

    const fetchParticipantTags = async (participantId: string) => {
        try {
            const res = await fetch(`/api/participants/${participantId}/tags`);
            const data = await res.json();
            setParticipantTags(data || []);
        } catch (error) {
            console.error('Failed to fetch participant tags:', error);
        }
    };

    const addTagToParticipant = async (tagId: string) => {
        if (!participant) return;
        const newTags = [...participantTags.map(t => t.id), tagId];
        try {
            const res = await fetch(`/api/participants/${participant.id}/tags`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagIds: newTags })
            });
            if (res.ok) {
                const data = await res.json();
                setParticipantTags(data);
            }
        } catch (error) {
            console.error('Failed to add tag:', error);
        }
        setShowTagDropdown(false);
    };

    const removeTagFromParticipant = async (tagId: string) => {
        if (!participant) return;
        const newTags = participantTags.filter(t => t.id !== tagId).map(t => t.id);
        try {
            const res = await fetch(`/api/participants/${participant.id}/tags`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagIds: newTags })
            });
            if (res.ok) {
                const data = await res.json();
                setParticipantTags(data);
            }
        } catch (error) {
            console.error('Failed to remove tag:', error);
        }
    };

    const createAndAddTag = async () => {
        if (!newTagName.trim() || !participant) return;
        try {
            // Create new tag
            const createRes = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTagName.trim(),
                    color: `hsl(${Math.random() * 360}, 60%, 50%)` // Random color
                })
            });
            if (createRes.ok) {
                const newTag = await createRes.json();
                setAllTags(prev => [...prev, newTag]);
                await addTagToParticipant(newTag.id);
            } else if (createRes.status === 409) {
                // Tag exists, find and add it
                const existing = allTags.find(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());
                if (existing) await addTagToParticipant(existing.id);
            }
        } catch (error) {
            console.error('Failed to create tag:', error);
        }
        setNewTagName('');
        setShowTagDropdown(false);
    };

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

                    // Fetch documents and tags
                    fetchDocuments(found.id);
                    fetchParticipantTags(found.id);
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

                    {/* Tags Section */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Tags (for Segmentation)</h2>
                        <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px' }}>
                            Add tags for filtering data by demographics, attitudes, etc.
                        </p>

                        {/* Current tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                            {participantTags.map(tag => (
                                <span
                                    key={tag.id}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        borderRadius: '16px',
                                        background: tag.color || '#6B7280',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 500
                                    }}
                                >
                                    {tag.name}
                                    <button
                                        onClick={() => removeTagFromParticipant(tag.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            padding: 0,
                                            fontSize: '14px',
                                            opacity: 0.8
                                        }}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            {participantTags.length === 0 && (
                                <span style={{ color: '#A0AEC0', fontSize: '13px' }}>No tags yet</span>
                            )}
                        </div>

                        {/* Add tag dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className={styles.secondaryBtn}
                                onClick={() => setShowTagDropdown(!showTagDropdown)}
                                style={{ fontSize: '13px' }}
                            >
                                + Add Tag
                            </button>

                            {showTagDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    marginTop: '4px',
                                    background: 'white',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    zIndex: 100,
                                    minWidth: '200px',
                                    maxHeight: '250px',
                                    overflowY: 'auto'
                                }}>
                                    {/* Create new tag input */}
                                    <div style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <input
                                                type="text"
                                                value={newTagName}
                                                onChange={(e) => setNewTagName(e.target.value)}
                                                placeholder="Create new tag..."
                                                onKeyDown={(e) => e.key === 'Enter' && createAndAddTag()}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px 8px',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                            <button
                                                onClick={createAndAddTag}
                                                disabled={!newTagName.trim()}
                                                style={{
                                                    padding: '6px 10px',
                                                    background: '#9A3324',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Existing tags */}
                                    {allTags
                                        .filter(t => !participantTags.some(pt => pt.id === t.id))
                                        .map(tag => (
                                            <div
                                                key={tag.id}
                                                onClick={() => addTagToParticipant(tag.id)}
                                                style={{
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    borderBottom: '1px solid #F7FAFC'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = '#F7FAFC')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                                            >
                                                <span
                                                    style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        borderRadius: '50%',
                                                        background: tag.color || '#6B7280'
                                                    }}
                                                />
                                                <span style={{ fontSize: '13px' }}>{tag.name}</span>
                                            </div>
                                        ))}

                                    {allTags.filter(t => !participantTags.some(pt => pt.id === t.id)).length === 0 && (
                                        <div style={{ padding: '12px', color: '#A0AEC0', fontSize: '12px', textAlign: 'center' }}>
                                            Type above to create a new tag
                                        </div>
                                    )}
                                </div>
                            )}
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
                {session ? (
                    <ParticipantRatingData
                        sessionId={session.id}
                        participantCode={participant.code}
                        participantName={displayName}
                    />
                ) : (
                    <div className={styles.emptyState} style={{ padding: '24px' }}>
                        <p style={{ color: '#718096' }}>
                            Session not found.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

