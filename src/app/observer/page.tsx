'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    LiveKitRoom,
    VideoTrack,
    useTracks,
    RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

function ObserverContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session');

    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

    const joinAsObserver = async () => {
        if (!sessionId) {
            setError('No session ID provided');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const response = await fetch('/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomName: sessionId,
                    isObserver: true,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get token');
            }

            const data = await response.json();
            setToken(data.token);
        } catch (err) {
            console.error('[Observer] Join error:', err);
            setError('Failed to join session');
        } finally {
            setIsConnecting(false);
        }
    };

    // Auto-join when session ID is present
    useEffect(() => {
        if (sessionId && !token) {
            joinAsObserver();
        }
    }, [sessionId]);

    if (!sessionId) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>👁️ Observer Mode</h1>
                    <p style={styles.subtitle}>No session ID provided</p>
                    <p style={styles.hint}>Add ?session=YOUR-SESSION-ID to the URL</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>❌ Error</h1>
                    <p style={styles.error}>{error}</p>
                    <button onClick={joinAsObserver} style={styles.button}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>👁️ Observer Mode</h1>
                    <p style={styles.subtitle}>
                        {isConnecting ? 'Connecting...' : 'Ready to observe'}
                    </p>
                    <p style={styles.hint}>Session: {sessionId}</p>
                    {!isConnecting && (
                        <button onClick={joinAsObserver} style={styles.button}>
                            Join as Observer
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            video={false}
            audio={false}
            style={{ height: '100vh', background: '#0F0F1A' }}
        >
            <ObserverLayout sessionId={sessionId} />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}

function ObserverLayout({ sessionId }: { sessionId: string }) {
    const tracks = useTracks(
        [{ source: Track.Source.Camera, withPlaceholder: true }],
        { onlySubscribed: false }
    );

    // Filter to only show non-hidden participants (excludes other observers)
    const visibleTracks = tracks.filter(t => !t.participant.identity.startsWith('observer-'));

    return (
        <div style={styles.observerContainer}>
            {/* Header */}
            <div style={styles.header}>
                <span style={styles.badge}>👁️ OBSERVER MODE</span>
                <span style={styles.sessionLabel}>Session: {sessionId}</span>
                <span style={styles.hint}>You are invisible to participants</span>
            </div>

            {/* Video Grid */}
            <div style={styles.grid}>
                {visibleTracks.length === 0 ? (
                    <div style={styles.waiting}>
                        <span style={{ fontSize: '3rem' }}>⏳</span>
                        <p>Waiting for participants to join...</p>
                    </div>
                ) : (
                    visibleTracks.map((trackRef) => (
                        <div key={trackRef.participant.identity} style={styles.tile}>
                            {trackRef.publication?.track ? (
                                <VideoTrack
                                    trackRef={trackRef}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={styles.placeholder}>
                                    <span style={{ fontSize: '2rem' }}>👤</span>
                                    <span>Camera off</span>
                                </div>
                            )}
                            <div style={styles.nameTag}>
                                {trackRef.participant.identity}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <span>🔇 Your camera and microphone are disabled</span>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 100%)',
        padding: '20px',
    },
    card: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '400px',
    },
    title: {
        color: '#fff',
        fontSize: '1.5rem',
        marginBottom: '8px',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        marginBottom: '8px',
    },
    hint: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: '12px',
    },
    error: {
        color: '#ef4444',
        marginBottom: '16px',
    },
    button: {
        marginTop: '16px',
        padding: '12px 24px',
        background: '#9A3324',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
    },
    observerContainer: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0F0F1A',
    },
    header: {
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    badge: {
        background: 'rgba(154, 51, 36, 0.3)',
        color: '#facc15',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
    },
    sessionLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: '13px',
    },
    grid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '12px',
        padding: '16px',
        overflow: 'auto',
    },
    tile: {
        position: 'relative',
        background: '#1A1A2E',
        borderRadius: '12px',
        overflow: 'hidden',
        aspectRatio: '16/9',
    },
    placeholder: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)',
        gap: '8px',
    },
    nameTag: {
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '12px',
    },
    waiting: {
        gridColumn: '1 / -1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)',
        gap: '12px',
        padding: '40px',
    },
    footer: {
        padding: '12px 20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
    },
};

export default function ObserverPage() {
    return (
        <Suspense fallback={
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Loading...</h1>
                </div>
            </div>
        }>
            <ObserverContent />
        </Suspense>
    );
}
