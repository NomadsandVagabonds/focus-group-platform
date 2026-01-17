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

const VideoGrid = dynamic(() => import('@/components/VideoGrid'), {
    ssr: false,
    loading: () => <div className={styles.mediaPlaceholder}>Loading video...</div>
});

function ParticipantContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session') || 'demo-session';
    const userId = searchParams.get('user') || `participant-${Date.now()}`;

    const [token, setToken] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isDialActive, setIsDialActive] = useState(true);
    const [currentMediaTimestamp, setCurrentMediaTimestamp] = useState<number | undefined>();

    const roomRef = useRef<Room | null>(null);

    // Get LiveKit token
    useEffect(() => {
        async function getToken() {
            try {
                const res = await fetch('/api/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: sessionId,
                        participantName: userId,
                        isModerator: false,
                    }),
                });
                const data = await res.json();
                setToken(data.token);
            } catch (error) {
                console.error('Failed to get token:', error);
            }
        }
        getToken();
    }, [sessionId, userId]);

    // Handle room connection
    const handleRoomConnected = useCallback((room: Room) => {
        console.log('Participant connected to room');
        roomRef.current = room;
        setRoom(room);
        setIsConnected(true);
        setIsDialActive(true);
    }, []);

    // Handle room disconnection
    const handleRoomDisconnected = useCallback(() => {
        console.log('Participant disconnected from room');
        setIsConnected(false);
    }, []);

    // Handle perception value changes - send via LiveKit data channel
    const handlePerceptionChange = useCallback((value: number, timestamp: number) => {
        if (!isConnected) return;

        const dataPoint: PerceptionDataPoint = {
            userId,
            sessionId,
            timestamp,
            value,
            mediaTimestamp: currentMediaTimestamp,
        };
        sendPerceptionData(dataPoint);
    }, [userId, sessionId, currentMediaTimestamp, isConnected]);

    return (
        <div className={styles.container}>
            {/* Header - compact */}
            <header className={styles.header}>
                <button className={styles.backBtn}>← Session</button>
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
                        <VideoGrid
                            token={token}
                            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud'}
                            maxParticipants={10}
                            showPerceptionOverlay={false}
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
                    isActive={isDialActive && isConnected}
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
