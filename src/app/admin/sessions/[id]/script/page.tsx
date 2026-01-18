'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../../admin.module.css';

interface ScriptSection {
    id: string;
    title: string;
    estimatedMinutes: number;
    content: string;
    mediaTag?: string; // Reference to media item
}

interface MediaItem {
    id: string;
    filename: string;
    file_type: string;
    tag?: string;
}

export default function ScriptEditorPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [sections, setSections] = useState<ScriptSection[]>([
        { id: '1', title: 'Introduction', estimatedMinutes: 5, content: 'Welcome participants and explain the session format.' },
        { id: '2', title: 'Main Discussion', estimatedMinutes: 30, content: 'Present key topics and facilitate discussion.' },
        { id: '3', title: 'Wrap Up', estimatedMinutes: 10, content: 'Summarize key points and thank participants.' },
    ]);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch media for this session
    useEffect(() => {
        fetch(`/api/session-media?sessionId=${sessionId}`)
            .then(res => res.ok ? res.json() : { media: [] })
            .then(data => setMedia(data.media || []))
            .catch(() => setMedia([]));
    }, [sessionId]);

    const addSection = useCallback(() => {
        setSections(prev => [...prev, {
            id: Date.now().toString(),
            title: 'New Section',
            estimatedMinutes: 5,
            content: ''
        }]);
    }, []);

    const updateSection = useCallback((id: string, updates: Partial<ScriptSection>) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }, []);

    const removeSection = useCallback((id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
    }, []);

    const moveSection = useCallback((id: string, direction: 'up' | 'down') => {
        setSections(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (direction === 'up' && idx > 0) {
                const newArr = [...prev];
                [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
                return newArr;
            } else if (direction === 'down' && idx < prev.length - 1) {
                const newArr = [...prev];
                [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
                return newArr;
            }
            return prev;
        });
    }, []);

    const totalMinutes = sections.reduce((sum, s) => sum + s.estimatedMinutes, 0);

    return (
        <div className={styles.container}>
            <Link href={`/admin/sessions/${sessionId}`} className={styles.backLink}>
                ← Back to Session
            </Link>

            <div className={styles.pageHeader}>
                <h1>Session Script</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#718096', fontSize: '0.9rem' }}>
                        Total: {totalMinutes} min ({sections.length} sections)
                    </span>
                    <button className={styles.primaryBtn} onClick={addSection}>
                        + Add Section
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
                {/* Script Sections */}
                <div style={{ flex: 2 }}>
                    {sections.map((section, idx) => (
                        <div key={section.id} className={styles.card} style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: '#9A3324',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 700
                                    }}>{idx + 1}</span>
                                    <input
                                        type="text"
                                        value={section.title}
                                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            width: '200px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        value={section.estimatedMinutes}
                                        onChange={(e) => updateSection(section.id, { estimatedMinutes: parseInt(e.target.value) || 0 })}
                                        style={{ width: '50px', textAlign: 'center' }}
                                        min={1}
                                    />
                                    <span style={{ color: '#718096', fontSize: '0.8rem' }}>min</span>
                                    <button
                                        onClick={() => moveSection(section.id, 'up')}
                                        disabled={idx === 0}
                                        style={{ opacity: idx === 0 ? 0.3 : 1, cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                                    >↑</button>
                                    <button
                                        onClick={() => moveSection(section.id, 'down')}
                                        disabled={idx === sections.length - 1}
                                        style={{ opacity: idx === sections.length - 1 ? 0.3 : 1, cursor: idx === sections.length - 1 ? 'not-allowed' : 'pointer' }}
                                    >↓</button>
                                    <button
                                        onClick={() => removeSection(section.id)}
                                        style={{ color: '#e53e3e' }}
                                    >✕</button>
                                </div>
                            </div>

                            <textarea
                                value={section.content}
                                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                placeholder="Script content for this section... Use [play:tag] to link media"
                                rows={4}
                                style={{ width: '100%', fontFamily: 'inherit' }}
                            />

                            {media.length > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                    <select
                                        value={section.mediaTag || ''}
                                        onChange={(e) => updateSection(section.id, { mediaTag: e.target.value })}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        <option value="">🎬 Link media...</option>
                                        {media.map(m => (
                                            <option key={m.id} value={m.filename}>
                                                {m.file_type === 'image' ? '🖼️' :
                                                    m.file_type === 'video' ? '🎬' :
                                                        m.file_type === 'audio' ? '🔊' : '📄'} {m.filename}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}

                    {sections.length === 0 && (
                        <div className={styles.card} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                            No sections yet. Click "+ Add Section" to get started.
                        </div>
                    )}
                </div>

                {/* Sidebar - Media Reference */}
                <div style={{ width: '280px' }}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Available Media</h3>
                        {media.length === 0 ? (
                            <p style={{ color: '#718096', fontSize: '0.85rem' }}>
                                No media uploaded. <Link href={`/admin/sessions/${sessionId}/media`}>Upload media</Link>
                            </p>
                        ) : (
                            <div style={{ fontSize: '0.85rem' }}>
                                {media.map(m => (
                                    <div key={m.id} style={{ padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                                        {m.file_type === 'image' ? '🖼️' :
                                            m.file_type === 'video' ? '🎬' :
                                                m.file_type === 'audio' ? '🔊' : '📄'} {m.filename}
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link
                            href={`/admin/sessions/${sessionId}/media`}
                            className={styles.secondaryBtn}
                            style={{ display: 'block', textAlign: 'center', marginTop: '12px', textDecoration: 'none' }}
                        >
                            Manage Media
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
