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

    const [sections, setSections] = useState<ScriptSection[]>([]);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    // Default template with comprehensive focus group content
    const DEFAULT_TEMPLATE: ScriptSection[] = [
        {
            id: 'intro',
            title: '1. Introduction & Welcome',
            estimatedMinutes: 3,
            content: `Hi everyone, thank you for joining today. My name is [YOUR NAME] and I'll be moderating our discussion.

We're here to talk about [TOPIC]. There are no right or wrong answers – we just want your honest opinions and perspectives.

Please feel free to speak up at any time. We want this to be a conversation, not an interview.`
        },
        {
            id: 'consent',
            title: '2. Consent & Recording',
            estimatedMinutes: 2,
            content: `Before we begin, I need to let you know that this session is being recorded for research purposes.

Your identities will be kept confidential in any reports or publications.

By staying in the session, you consent to this recording. Does anyone have questions about this?`
        },
        {
            id: 'warmup',
            title: '3. Warm-up & Introductions',
            estimatedMinutes: 5,
            content: `Let's go around the room and introduce ourselves. Please share:
• Your first name
• Where you're from
• One interesting thing you did this weekend`
        },
        {
            id: 'topic1',
            title: '4. Topic Exploration',
            estimatedMinutes: 15,
            content: `Now let's dive into our main topic.

Q1: When you hear the term "[KEY TERM]", what's the first word that comes to mind?

Q2: How familiar would you say you are with [TOPIC]?

Q3: Do you use any [RELATED TOOLS/SERVICES] in your daily life?`
        },
        {
            id: 'stimulus',
            title: '5. Stimulus / Media Review',
            estimatedMinutes: 10,
            content: `We're going to show you something now. Please watch/read carefully and use the slider to show your real-time reaction.

[PRESENT MEDIA HERE]

What stood out to you most?
What questions do you have after seeing this?`
        },
        {
            id: 'debrief',
            title: '6. Debrief Discussion',
            estimatedMinutes: 15,
            content: `Let's discuss what we just saw.

• What was your overall impression?
• Was there anything surprising or unexpected?
• Did this change how you think about [TOPIC]?
• Who do you think should be responsible for [KEY ISSUE]?`
        },
        {
            id: 'closing',
            title: '7. Closing',
            estimatedMinutes: 3,
            content: `That wraps up our discussion. Thank you so much for sharing your perspectives today.

Your input is incredibly valuable to this research.

You'll receive your incentive via [PAYMENT METHOD] within [TIMEFRAME].

Does anyone have any final questions before we end?`
        }
    ];

    // Fetch script sections from API (try session script, then global template, then default)
    useEffect(() => {
        async function fetchScript() {
            try {
                // First, try to fetch this session's saved script
                const res = await fetch(`/api/session-scripts?sessionId=${sessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.sections && data.sections.length > 0) {
                        // Transform from API format to local format
                        const loadedSections = data.sections.map((s: {
                            section_id: string;
                            title: string;
                            estimated_minutes: number;
                            content: string;
                            media_tag?: string;
                        }) => ({
                            id: s.section_id,
                            title: s.title,
                            estimatedMinutes: s.estimated_minutes,
                            content: s.content || '',
                            mediaTag: s.media_tag,
                        }));
                        setSections(loadedSections);
                        setIsLoading(false);
                        return;
                    }
                }

                // No saved script - try global template
                const templateRes = await fetch('/api/session-scripts?sessionId=global-template');
                if (templateRes.ok) {
                    const templateData = await templateRes.json();
                    if (templateData.sections && templateData.sections.length > 0) {
                        const loadedSections = templateData.sections.map((s: {
                            section_id: string;
                            title: string;
                            estimated_minutes: number;
                            content: string;
                            media_tag?: string;
                        }) => ({
                            id: s.section_id,
                            title: s.title,
                            estimatedMinutes: s.estimated_minutes,
                            content: s.content || '',
                            mediaTag: s.media_tag,
                        }));
                        setSections(loadedSections);
                        setHasChanges(true); // Template loaded but not saved to this session yet
                        setIsLoading(false);
                        return;
                    }
                }

                // Fall back to hardcoded default template
                setSections(DEFAULT_TEMPLATE);
                setHasChanges(true); // Default loaded but not saved yet
            } catch (error) {
                console.error('[Script] Failed to fetch:', error);
                setSections(DEFAULT_TEMPLATE);
            } finally {
                setIsLoading(false);
            }
        }
        fetchScript();
    }, [sessionId]);

    // Fetch media for this session
    useEffect(() => {
        fetch(`/api/session-media?sessionId=${sessionId}`)
            .then(res => res.ok ? res.json() : { media: [] })
            .then(data => setMedia(data.media || []))
            .catch(() => setMedia([]));
    }, [sessionId]);

    // Save script to this session
    const saveScript = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/session-scripts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, sections }),
            });
            if (res.ok) {
                setHasChanges(false);
                alert('Script saved!');
            } else {
                alert('Failed to save script');
            }
        } catch (error) {
            console.error('[Script] Save error:', error);
            alert('Failed to save script');
        } finally {
            setIsSaving(false);
        }
    };

    // Save as global template for all new sessions
    const saveAsTemplate = async () => {
        if (!confirm('Save this script as the default template for all new sessions?')) {
            return;
        }
        setIsSavingTemplate(true);
        try {
            const res = await fetch('/api/session-scripts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: 'global-template', sections }),
            });
            if (res.ok) {
                alert('Template saved! New sessions will start with this script.');
            } else {
                alert('Failed to save template');
            }
        } catch (error) {
            console.error('[Script] Template save error:', error);
            alert('Failed to save template');
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const addSection = useCallback(() => {
        setSections(prev => [...prev, {
            id: Date.now().toString(),
            title: 'New Section',
            estimatedMinutes: 5,
            content: ''
        }]);
        setHasChanges(true);
    }, []);

    const updateSection = useCallback((id: string, updates: Partial<ScriptSection>) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        setHasChanges(true);
    }, []);

    const removeSection = useCallback((id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
        setHasChanges(true);
    }, []);

    const moveSection = useCallback((id: string, direction: 'up' | 'down') => {
        setSections(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (direction === 'up' && idx > 0) {
                const newArr = [...prev];
                [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
                setHasChanges(true);
                return newArr;
            } else if (direction === 'down' && idx < prev.length - 1) {
                const newArr = [...prev];
                [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
                setHasChanges(true);
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
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#718096', fontSize: '0.9rem' }}>
                        Total: {totalMinutes} min ({sections.length} sections)
                    </span>
                    <button className={styles.secondaryBtn} onClick={addSection}>
                        + Add Section
                    </button>
                    <button
                        className={styles.primaryBtn}
                        onClick={saveScript}
                        disabled={isSaving || !hasChanges}
                        style={{ opacity: (isSaving || !hasChanges) ? 0.6 : 1 }}
                    >
                        {isSaving ? 'Saving...' : hasChanges ? '💾 Save Script' : '✓ Saved'}
                    </button>
                    <button
                        className={styles.secondaryBtn}
                        onClick={saveAsTemplate}
                        disabled={isSavingTemplate}
                        style={{
                            borderColor: '#9A3324',
                            color: '#9A3324',
                            opacity: isSavingTemplate ? 0.6 : 1
                        }}
                        title="Save this script as the default for all new sessions"
                    >
                        {isSavingTemplate ? 'Saving...' : '📋 Save as Template'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
                {/* Script Sections */}
                <div style={{ flex: 2 }}>
                    {isLoading ? (
                        <div className={styles.card} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                            Loading script...
                        </div>
                    ) : sections.map((section, idx) => (
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
