'use client';

import React, { Suspense, useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Room } from 'livekit-client';
import PerceptionBar from '@/components/PerceptionBar';
import {
    sendPerceptionData,
    setRoom,
    PerceptionDataPoint
} from '@/lib/livekit-data';
import styles from './page.module.css';

const ParticipantVideoGrid = dynamic(() => import('@/components/ParticipantVideoGrid'), {
    ssr: false,
    loading: () => <div className={styles.mediaPlaceholder}>Loading video...</div>
});

function ParticipantContent() {
    const searchParams = useSearchParams();

    // Support both new validated params and legacy params for backwards compatibility
    const sessionId = searchParams.get('session') || 'demo-session';
    const participantId = searchParams.get('pid') || null; // From validated login
    const displayName = searchParams.get('name') || searchParams.get('user') || 'Participant';

    // Use useState to keep userId stable across re-renders
    const [userId, setUserId] = useState(() => {
        // Use display name for LiveKit identity
        return displayName || `participant-${Date.now()}`;
    });

    const [token, setToken] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isDialActive, setIsDialActive] = useState(true);

    // Use refs to avoid stale closures
    const roomRef = useRef<Room | null>(null);
    const isConnectedRef = useRef(false);

    // Get LiveKit token and handle persistence
    useEffect(() => {
        async function getToken() {
            try {
                // If we found a saved session ID in localStorage, use it if none provided in URL
                const targetSessionId = sessionId;

                const res = await fetch('/api/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: targetSessionId,
                        participantName: userId,
                        isModerator: false,
                    }),
                });
                const data = await res.json();
                setToken(data.token);

                // Persist session details once we have a valid token
                localStorage.setItem('fg_session_id', targetSessionId);
                localStorage.setItem('fg_participant_id', userId);
            } catch (error) {
                console.error('Failed to get token:', error);
            }
        }
        getToken();
    }, [sessionId, userId]);

    // Handle manual logout
    const handleLogout = useCallback(() => {
        if (roomRef.current) {
            roomRef.current.disconnect();
        }
        setToken(null);
        setIsConnected(false);
        localStorage.removeItem('fg_session_id');
        localStorage.removeItem('fg_participant_id');
        // Force reload to clear state and generate new ID if needed
        window.location.href = '/';
    }, []);

    // Handle room connection
    const handleRoomConnected = useCallback((room: Room) => {
        console.log('[Participant] Room CONNECTED');
        roomRef.current = room;
        isConnectedRef.current = true;
        setRoom(room);
        setIsConnected(true);
        setIsDialActive(true);
    }, []);

    // Handle room disconnection
    const handleRoomDisconnected = useCallback(() => {
        console.log('[Participant] Room DISCONNECTED');
        isConnectedRef.current = false;
        setIsConnected(false);
    }, []);

    // Handle perception value changes - use ref to avoid stale closure
    const handlePerceptionChange = useCallback((value: number, timestamp: number) => {
        console.log('[Participant] handlePerceptionChange - value:', value, 'connected:', isConnectedRef.current);

        if (!isConnectedRef.current) {
            console.log('[Participant] NOT connected, skipping');
            return;
        }

        const dataPoint: PerceptionDataPoint = {
            userId,
            sessionId,
            timestamp,
            value,
        };

        console.log('[Participant] Sending perception data:', value);
        sendPerceptionData(dataPoint);
    }, [userId, sessionId]);

    return (
        <div className={styles.container}>
            {/* Header - compact */}
            <header className={styles.header}>
                {isConnected ? (
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        Leave Session
                    </button>
                ) : (
                    <button className={styles.backBtn} onClick={() => window.location.href = '/'}>
                        ← Back
                    </button>
                )}

                <div className={styles.connectionStatus}>
                    <span
                        className={styles.statusDot}
                        style={{ backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}
                    />
                    {isConnected ? 'Live' : 'Connecting...'}
                </div>
            </header>

            {/* Main content area - Media takes priority */}
            <main className={styles.main}>
                {/* Instructions panel (optional - can be hidden) */}
                <aside className={styles.instructions}>
                    <p>
                        Use the slider and emoji below to rate your reaction.
                        <strong> Rate continuously</strong> throughout the session.
                    </p>
                </aside>

                {/* Media area - shows video feed from moderator */}
                <div className={styles.mediaArea}>
                    {token ? (
                        <ParticipantVideoGrid
                            token={token}
                            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud'}
                            onRoomConnected={handleRoomConnected}
                            onRoomDisconnected={handleRoomDisconnected}
                        />
                    ) : (
                        <div className={styles.mediaPlaceholder}>
                            <div className={styles.placeholderIcon}>🎬</div>
                            <p>Connecting to session...</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Perception bar - fixed at bottom */}
            <footer className={styles.footer}>
                <PerceptionBar
                    onValueChange={handlePerceptionChange}
                    intervalMs={250}
                    isActive={isDialActive}
                    enableHaptics={true}
                    showPrompt={true}
                />
            </footer>
        </div>
    );
}

export default function ParticipantPage() {
    return (
        <Suspense fallback={<div className={styles.container}>Loading...</div>}>
            <ParticipantContent />
        </Suspense>
    );
}
