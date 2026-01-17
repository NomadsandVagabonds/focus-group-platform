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

const ModeratorVideoGrid = dynamic(() => import('@/components/ModeratorVideoGrid'), {
    ssr: false,
    loading: () => <div className={styles.videoPlaceholder}>Loading video...</div>
});

function ModeratorContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session') || 'demo-session';
    const moderatorId = searchParams.get('user') || `moderator-${Date.now()}`;

    const [token, setToken] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [aggregateData, setAggregateData] = useState<AggregateData[]>([]);
    const [perceptionValues, setPerceptionValues] = useState<Record<string, number>>({});
    const [participantCount, setParticipantCount] = useState(0);

    const roomRef = useRef<Room | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Get LiveKit token with moderator privileges
    useEffect(() => {
        async function getToken() {
            try {
                const res = await fetch('/api/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: sessionId,
                        participantName: moderatorId,
                        isModerator: true,
                    }),
                });
                const data = await res.json();
                setToken(data.token);
            } catch (error) {
                console.error('Failed to get token:', error);
            }
        }
        getToken();
    }, [sessionId, moderatorId]);

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

    // Calculate current average
    const currentAverage = aggregateData.length > 0
        ? Math.round(aggregateData[aggregateData.length - 1].mean)
        : 50;

    // Handle recording toggle
    const toggleRecording = useCallback(() => {
        // TODO: Implement LiveKit recording via egress API
        setIsRecording(!isRecording);
    }, [isRecording]);

    // Copy join link
    const copyJoinLink = useCallback(() => {
        const url = `${window.location.origin}/participant?session=${sessionId}`;
        navigator.clipboard.writeText(url);
    }, [sessionId]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Focus Group Moderator</h1>
                    <div className={styles.sessionBadge}>
                        <span className={styles.sessionLabel}>Session:</span>
                        <span className={styles.sessionId}>{sessionId}</span>
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
                        <span
                            className={styles.statusDot}
                            style={{ backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}
                        />
                        {isConnected ? 'Live' : 'Connecting...'}
                    </div>
                </div>
            </header>

            {/* Main layout */}
            <div className={styles.mainLayout}>
                {/* Video grid */}
                <div className={styles.videoSection}>
                    {token && (
                        <ModeratorVideoGrid
                            token={token}
                            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud'}
                            perceptionValues={perceptionValues}
                            onRoomConnected={handleRoomConnected}
                            onRoomDisconnected={handleRoomDisconnected}
                        />
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

                        <button className={styles.controlBtn} onClick={copyJoinLink}>
                            📋 Copy Join Link
                        </button>

                        <div className={styles.joinInfo}>
                            <p>Participants can join at:</p>
                            <code className={styles.joinUrl}>
                                /participant?session={sessionId}
                            </code>
                        </div>
                    </div>

                    {/* Participant list */}
                    <div className={styles.participantList}>
                        <h3 className={styles.sectionTitle}>Participants</h3>
                        {Object.entries(perceptionValues).map(([id, value]) => (
                            <div key={id} className={styles.participantItem}>
                                <span className={styles.participantName}>{id}</span>
                                <span
                                    className={styles.participantValue}
                                    style={{
                                        color: value < 35 ? 'var(--color-dial-negative)'
                                            : value > 65 ? 'var(--color-dial-positive)'
                                                : 'var(--color-dial-neutral)'
                                    }}
                                >
                                    {Math.round(value)}
                                </span>
                            </div>
                        ))}
                        {Object.keys(perceptionValues).length === 0 && (
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
