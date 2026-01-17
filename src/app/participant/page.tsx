'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PerceptionBar from '@/components/PerceptionBar';
import MockVideoPlayer from '@/components/MockVideoPlayer';
import {
    connectSocket,
    disconnectSocket,
    sendPerceptionData,
    PerceptionDataPoint
} from '@/lib/socket';
import styles from './page.module.css';

function ParticipantContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session') || 'demo-session';
    const userId = searchParams.get('user') || `participant-${Date.now()}`;

    const [isConnected, setIsConnected] = useState(false);
    const [isDialActive, setIsDialActive] = useState(true);
    const [currentMediaTimestamp, setCurrentMediaTimestamp] = useState<number | undefined>();

    // Connect to WebSocket
    useEffect(() => {
        const socket = connectSocket(sessionId, userId);

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to perception server');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('session:media-sync', (timestamp: number) => {
            setCurrentMediaTimestamp(timestamp);
        });

        socket.on('session:recording-started', () => {
            setIsDialActive(true);
        });

        socket.on('session:recording-stopped', () => {
            setIsDialActive(false);
        });

        return () => {
            disconnectSocket();
        };
    }, [sessionId, userId]);

    // Handle perception value changes
    const handlePerceptionChange = useCallback((value: number, timestamp: number) => {
        const dataPoint: PerceptionDataPoint = {
            userId,
            sessionId,
            timestamp,
            value,
            mediaTimestamp: currentMediaTimestamp,
        };
        sendPerceptionData(dataPoint);
    }, [userId, sessionId, currentMediaTimestamp]);

    // Handle media time updates
    const handleMediaTimeUpdate = useCallback((timestamp: number) => {
        setCurrentMediaTimestamp(timestamp);
    }, []);

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

                {/* Media area - takes most space */}
                <div className={styles.mediaArea}>
                    <MockVideoPlayer
                        showLocalWebcam={true}
                        showPlaceholder={true}
                        onTimeUpdate={handleMediaTimeUpdate}
                    />
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
