'use client';

import React, { Suspense, useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Room } from 'livekit-client';
import PerceptionOverlay from '@/components/PerceptionOverlay';
import {
    subscribeToPerceptionUpdates,
    AggregateData,
    PerceptionDataPoint,
} from '@/lib/livekit-data';
import styles from './page.module.css';
import ModeratorScript from '@/components/ModeratorScript';

const ModeratorVideoGrid = dynamic(() => import('@/components/ModeratorVideoGrid'), {
    ssr: false,
    loading: () => <div className={styles.videoPlaceholder}>Loading video...</div>
});

// Participant accordion component for showing notes
function ParticipantAccordion({
    participantId,
    currentValue,
    sessionId,
    isMuted,
    hasHandRaised,
    hasSpoken,
    onToggleSpoken
}: {
    participantId: string;
    currentValue: number | undefined;
    sessionId: string;
    isMuted: boolean;
    hasHandRaised: boolean;
    hasSpoken: boolean;
    onToggleSpoken: () => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [notes, setNotes] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotes = async () => {
        if (notes !== null) return; // Already fetched
        setIsLoading(true);
        try {
            // Try to find participant by their display name in the session
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                const participant = data.participants?.find(
                    (p: { display_name?: string; code: string }) =>
                        p.display_name === participantId || p.code === participantId
                );
                setNotes(participant?.notes || 'No notes available');
            }
        } catch (error) {
            setNotes('Could not load notes');
        }
        setIsLoading(false);
    };

    const handleToggle = () => {
        if (!isExpanded) {
            fetchNotes();
        }
        setIsExpanded(!isExpanded);
    };

    const getValueColor = (value: number) => {
        if (value < 35) return 'var(--color-dial-negative)';
        if (value > 65) return 'var(--color-dial-positive)';
        return 'var(--color-dial-neutral)';
    };

    return (
        <div className={styles.participantItem} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div
                onClick={handleToggle}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '2px 0'
                }}
            >
                <span className={styles.participantName} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        fontSize: '10px',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        opacity: 0.6
                    }}>▶</span>
                    {/* Has spoken checkbox */}
                    <input
                        type="checkbox"
                        checked={hasSpoken}
                        onChange={(e) => {
                            e.stopPropagation();
                            onToggleSpoken();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title={hasSpoken ? 'Has spoken' : 'Not yet spoken'}
                        style={{
                            width: '14px',
                            height: '14px',
                            cursor: 'pointer',
                            accentColor: '#38a169'
                        }}
                    />
                    {/* Status indicators */}
                    {hasHandRaised && <span title="Hand raised" style={{ fontSize: '12px' }}>✋</span>}
                    <span
                        title={isMuted ? 'Muted' : 'Unmuted'}
                        style={{
                            fontSize: '10px',
                            opacity: isMuted ? 1 : 0.4
                        }}
                    >
                        {isMuted ? '🔇' : '🎤'}
                    </span>
                    <span style={{ opacity: hasSpoken ? 0.5 : 1 }}>{participantId}</span>
                </span>
                {currentValue !== undefined ? (
                    <span className={styles.participantValue} style={{ color: getValueColor(currentValue) }}>
                        {Math.round(currentValue)}
                    </span>
                ) : (
                    <span className={styles.participantValue} style={{ opacity: 0.4 }}>—</span>
                )}
            </div>
            {isExpanded && (
                <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5
                }}>
                    <div style={{
                        fontSize: '10px',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '6px'
                    }}>
                        Notes
                    </div>
                    {isLoading ? 'Loading...' : notes}
                </div>
            )}
        </div>
    );
}

function ModeratorContent() {
    const searchParams = useSearchParams();
    const sessionCodeOrId = searchParams.get('session') || 'demo-session';

    // IMPORTANT: Use useState to keep moderatorId stable across re-renders
    // Without this, Date.now() would generate a new ID on every render, causing infinite token requests!
    const [moderatorId] = useState(() =>
        searchParams.get('user') || `moderator-${Date.now()}`
    );

    const [token, setToken] = useState<string | null>(null);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [aggregateData, setAggregateData] = useState<AggregateData[]>([]);
    const [perceptionValues, setPerceptionValues] = useState<Record<string, number>>({});
    const [participantCount, setParticipantCount] = useState(0);
    const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(null);
    const [sessionName, setSessionName] = useState<string | null>(null);

    // Participant state from video grid (muted, hand raises, connected)
    const [participantState, setParticipantState] = useState<{
        mutedParticipants: Set<string>;
        handRaises: Record<string, number>;
        connectedParticipants: string[];
    }>({
        mutedParticipants: new Set(),
        handRaises: {},
        connectedParticipants: []
    });

    // Track who has spoken/been called on (local only, not persisted)
    const [hasSpoken, setHasSpoken] = useState<Set<string>>(new Set());

    const roomRef = useRef<Room | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const isRecordingRef = useRef(false);
    const pendingEventsRef = useRef<{ participantId: string; value: number; timestamp: number }[]>([]);

    // First, resolve session code to UUID (if it's a code like PILOT-001)
    useEffect(() => {
        async function resolveSession() {
            // Check if it's already a UUID (contains hyphens and is 36 chars)
            const isUuid = sessionCodeOrId.length === 36 && sessionCodeOrId.includes('-');
            if (isUuid) {
                setResolvedSessionId(sessionCodeOrId);
                // Fetch session name for UUID
                try {
                    const res = await fetch(`/api/sessions/${sessionCodeOrId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSessionName(data.session?.name || 'Session');
                    }
                } catch {
                    setSessionName('Session');
                }
                return;
            }

            // It's a session code, look it up
            try {
                const res = await fetch(`/api/sessions?code=${sessionCodeOrId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.id) {
                        setResolvedSessionId(data.id);
                        setSessionName(data.name || sessionCodeOrId);
                        return;
                    }
                }
                // Fallback: use the code as-is (for backward compatibility)
                setResolvedSessionId(sessionCodeOrId);
                setSessionName(sessionCodeOrId);
            } catch {
                setResolvedSessionId(sessionCodeOrId);
                setSessionName(sessionCodeOrId);
            }
        }
        resolveSession();
    }, [sessionCodeOrId]);

    // Get LiveKit token with moderator privileges (after session is resolved)
    useEffect(() => {
        if (!resolvedSessionId) return;
        if (token) return; // Already have a token, don't refetch

        async function getToken() {
            try {
                const res = await fetch('/api/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: resolvedSessionId,
                        participantName: moderatorId,
                        isModerator: true,
                        moderatorSecret: process.env.NEXT_PUBLIC_MODERATOR_SECRET,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setTokenError(data.error || 'Failed to authenticate as moderator');
                    return;
                }
                setToken(data.token);
            } catch (error) {
                console.error('Failed to get token:', error);
                setTokenError('Connection error');
            }
        }
        getToken();
    }, [resolvedSessionId, moderatorId, token]);

    // Handle room connection - set up data channel subscriptions
    const handleRoomConnected = useCallback((room: Room) => {
        console.log('Room connected, setting up perception data subscriptions');
        roomRef.current = room;
        setIsConnected(true);

        // Subscribe to perception updates via LiveKit data channels
        unsubscribeRef.current = subscribeToPerceptionUpdates(
            room,
            // Individual perception updates
            (data: PerceptionDataPoint) => {
                console.log('Received perception update:', data.userId, data.value);
                // Save to pending events if recording
                if (isRecordingRef.current) {
                    pendingEventsRef.current.push({
                        participantId: data.userId,
                        value: data.value,
                        timestamp: data.timestamp,
                    });
                }
            },
            // Aggregate updates (calculated locally by aggregator)
            (data: AggregateData) => {
                setAggregateData(prev => {
                    const newData = [...prev, data];
                    // Keep last 5 minutes of data
                    const cutoff = Date.now() - 5 * 60 * 1000;
                    return newData.filter(d => d.timestamp >= cutoff);
                });

                setPerceptionValues(data.participants);
                setParticipantCount(Object.keys(data.participants).length);
            },
            true // isModerator - enables local aggregation
        );
    }, []);

    // Handle room disconnection
    const handleRoomDisconnected = useCallback(() => {
        console.log('Room disconnected');
        setIsConnected(false);
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    // Periodic flush of pending slider events (every 5 seconds during recording)
    useEffect(() => {
        const flushInterval = setInterval(async () => {
            if (isRecordingRef.current && pendingEventsRef.current.length > 0 && resolvedSessionId) {
                const eventsToFlush = [...pendingEventsRef.current];
                pendingEventsRef.current = [];

                try {
                    await fetch('/api/slider-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'batch',
                            sessionId: resolvedSessionId,
                            events: eventsToFlush,
                        }),
                    });
                    console.log(`[Moderator] Flushed ${eventsToFlush.length} slider events`);
                } catch (err) {
                    console.error('[Moderator] Failed to flush slider events:', err);
                    // Put events back if flush failed
                    pendingEventsRef.current = [...eventsToFlush, ...pendingEventsRef.current];
                }
            }
        }, 5000);

        return () => clearInterval(flushInterval);
    }, [resolvedSessionId]);

    // Calculate current average
    const currentAverage = aggregateData.length > 0
        ? Math.round(aggregateData[aggregateData.length - 1].mean)
        : 50;

    // Handle recording toggle
    const toggleRecording = useCallback(async () => {
        try {
            if (!isRecording) {
                // Start recording
                const [recordingRes, sliderRes] = await Promise.all([
                    fetch('/api/recording', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'start',
                            roomName: resolvedSessionId,
                            sessionId: resolvedSessionId,
                        }),
                    }),
                    fetch('/api/slider-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'start',
                            sessionId: resolvedSessionId,
                        }),
                    }),
                ]);

                if (recordingRes.ok && sliderRes.ok) {
                    isRecordingRef.current = true;
                    setIsRecording(true);
                    console.log('[Moderator] Recording started');
                } else {
                    const error = await recordingRes.json();
                    console.error('[Moderator] Failed to start recording:', error);
                    alert('Failed to start recording. Check console for details.');
                }
            } else {
                // Stop recording
                const [recordingRes, sliderRes] = await Promise.all([
                    fetch('/api/recording', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'stop',
                            roomName: resolvedSessionId,
                        }),
                    }),
                    fetch('/api/slider-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'stop',
                            sessionId: resolvedSessionId,
                        }),
                    }),
                ]);

                if (recordingRes.ok) {
                    isRecordingRef.current = false;
                    // Flush any remaining pending events
                    if (pendingEventsRef.current.length > 0) {
                        await fetch('/api/slider-data', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'batch',
                                sessionId: resolvedSessionId,
                                events: pendingEventsRef.current,
                            }),
                        });
                        pendingEventsRef.current = [];
                    }
                    setIsRecording(false);
                    console.log('[Moderator] Recording stopped');
                } else {
                    console.error('[Moderator] Failed to stop recording');
                }
            }
        } catch (error) {
            console.error('[Moderator] Recording error:', error);
            alert('Recording error. Check console for details.');
        }
    }, [isRecording, resolvedSessionId]);


    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.logo}>
                        <img src="/logo.png" alt="R" className={styles.logoMark} />
                        <span className={styles.logoText}>Resonant</span>
                    </div>
                    <div className={styles.sessionBadge}>
                        <span className={styles.sessionLabel}>Session:</span>
                        <span className={styles.sessionId}>{sessionName || 'Loading...'}</span>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{participantCount}</span>
                            <span className={styles.statLabel}>Participants</span>
                        </div>
                        <div className={styles.stat}>
                            <span
                                className={styles.statValue}
                                style={{
                                    color: currentAverage < 35 ? 'var(--color-dial-negative)'
                                        : currentAverage > 65 ? 'var(--color-dial-positive)'
                                            : 'var(--color-dial-neutral)'
                                }}
                            >
                                {currentAverage}
                            </span>
                            <span className={styles.statLabel}>Avg Score</span>
                        </div>
                    </div>

                    <div className={styles.connectionStatus}>
                        {isRecording ? (
                            <>
                                <span
                                    className={`${styles.statusDot} ${styles.recordingDot}`}
                                    style={{ backgroundColor: 'var(--color-danger)' }}
                                />
                                Recording
                            </>
                        ) : isConnected ? (
                            <>
                                <span
                                    className={styles.statusDot}
                                    style={{ backgroundColor: 'var(--color-text-secondary)' }}
                                />
                                Ready
                            </>
                        ) : (
                            <>
                                <span
                                    className={styles.statusDot}
                                    style={{ backgroundColor: 'var(--color-warning)' }}
                                />
                                Connecting...
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Script panel - fixed overlay */}
            <ModeratorScript sessionId={resolvedSessionId || undefined} />

            {/* Main layout */}
            <div className={styles.mainLayout}>
                {/* Video grid */}
                <div className={styles.videoSection}>
                    {tokenError ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#ef4444',
                            textAlign: 'center',
                            padding: '2rem'
                        }}>
                            <h2 style={{ marginBottom: '1rem' }}>Authentication Failed</h2>
                            <p>{tokenError}</p>
                            <p style={{ marginTop: '1rem', color: '#718096', fontSize: '0.875rem' }}>
                                Please access this page through the admin dashboard.
                            </p>
                        </div>
                    ) : token ? (
                        <ModeratorVideoGrid
                            token={token}
                            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud'}
                            sessionId={resolvedSessionId || undefined}
                            perceptionValues={perceptionValues}
                            onRoomConnected={handleRoomConnected}
                            onRoomDisconnected={handleRoomDisconnected}
                            onParticipantStateChange={setParticipantState}
                        />
                    ) : (
                        <div className={styles.videoPlaceholder}>Connecting...</div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    {/* Real-time chart */}
                    <div className={styles.chartSection}>
                        <PerceptionOverlay
                            data={aggregateData}
                            showIndividuals={true}
                            timeWindowSeconds={60}
                            height={200}
                        />
                    </div>

                    {/* Controls */}
                    <div className={styles.controlsSection}>
                        <h3 className={styles.sectionTitle}>Session Controls</h3>

                        <button
                            className={`${styles.controlBtn} ${isRecording ? styles.recording : ''}`}
                            onClick={toggleRecording}
                        >
                            <span className={styles.recordIcon} />
                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </button>
                    </div>

                    {/* Participant list with accordion */}
                    <div className={styles.participantList}>
                        <h3 className={styles.sectionTitle}>
                            Participants ({participantState.connectedParticipants.length})
                        </h3>
                        {participantState.connectedParticipants.map((id) => (
                            <ParticipantAccordion
                                key={id}
                                participantId={id}
                                currentValue={perceptionValues[id]}
                                sessionId={resolvedSessionId || ''}
                                isMuted={participantState.mutedParticipants.has(id)}
                                hasHandRaised={!!participantState.handRaises[id]}
                                hasSpoken={hasSpoken.has(id)}
                                onToggleSpoken={() => {
                                    setHasSpoken(prev => {
                                        const next = new Set(prev);
                                        if (next.has(id)) {
                                            next.delete(id);
                                        } else {
                                            next.add(id);
                                        }
                                        return next;
                                    });
                                }}
                            />
                        ))}
                        {participantState.connectedParticipants.length === 0 && (
                            <p className={styles.emptyState}>Waiting for participants...</p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default function ModeratorPage() {
    return (
        <Suspense fallback={<div className={styles.container}>Loading...</div>}>
            <ModeratorContent />
        </Suspense>
    );
}
