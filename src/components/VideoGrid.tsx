'use client';

import React, { useEffect } from 'react';
import {
    LiveKitRoom,
    ParticipantTile,
    useTracks,
    RoomAudioRenderer,
    useRoomContext,
    useConnectionState,
    useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, Room, ConnectionState } from 'livekit-client';
import { setRoom } from '@/lib/livekit-data';
import styles from './VideoGrid.module.css';

interface VideoGridProps {
    /** LiveKit room token */
    token: string;
    /** LiveKit server URL */
    serverUrl: string;
    /** Maximum number of participants to display */
    maxParticipants?: number;
    /** Show perception values overlay on each tile */
    showPerceptionOverlay?: boolean;
    /** Current perception values by participant ID */
    perceptionValues?: Record<string, number>;
    /** Callback when room connects (provides room for data channels) */
    onRoomConnected?: (room: Room) => void;
    /** Callback when room disconnects */
    onRoomDisconnected?: () => void;
}

// Inner component that can access room context and listens for connection events
function RoomDataHandler({
    onRoomConnected,
    onRoomDisconnected
}: {
    onRoomConnected?: (room: Room) => void;
    onRoomDisconnected?: () => void;
}) {
    const room = useRoomContext();
    const connectionState = useConnectionState();

    useEffect(() => {
        if (!room) return;

        console.log('[VideoGrid] Room connection state:', connectionState);

        if (connectionState === ConnectionState.Connected) {
            console.log('[VideoGrid] Room CONNECTED');
            setRoom(room);
            onRoomConnected?.(room);
        } else if (connectionState === ConnectionState.Disconnected) {
            console.log('[VideoGrid] Room DISCONNECTED');
            onRoomDisconnected?.();
        }
    }, [room, connectionState, onRoomConnected, onRoomDisconnected]);

    return null;
}

// Debug component to log participants
function ParticipantDebugger() {
    const participants = useParticipants();

    useEffect(() => {
        console.log('[VideoGrid] Total participants:', participants.length);
        participants.forEach(p => {
            console.log('[VideoGrid] Participant:', p.identity, 'tracks:', p.trackPublications.size);
        });
    }, [participants]);

    return null;
}

function ParticipantGrid({
    maxParticipants = 10,
    showPerceptionOverlay = false,
    perceptionValues = {},
}: Pick<VideoGridProps, 'maxParticipants' | 'showPerceptionOverlay' | 'perceptionValues'>) {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    // Log tracks for debugging
    useEffect(() => {
        console.log('[VideoGrid] Total tracks:', tracks.length);
        tracks.forEach(t => {
            console.log('[VideoGrid] Track:', t.participant.identity, t.source, t.publication?.trackName);
        });
    }, [tracks]);

    // Separate screen shares from camera tracks
    const screenShareTracks = tracks.filter(
        (t) => t.source === Track.Source.ScreenShare
    );
    const cameraTracks = tracks.filter(
        (t) => t.source === Track.Source.Camera
    ).slice(0, maxParticipants);

    return (
        <div className={styles.gridContainer}>
            {/* Screen share takes priority - large view */}
            {screenShareTracks.length > 0 && (
                <div className={styles.screenShareContainer}>
                    <ParticipantTile
                        trackRef={screenShareTracks[0]}
                        className={styles.screenShareTile}
                    />
                </div>
            )}

            {/* Participant grid */}
            <div
                className={styles.participantGrid}
                style={{
                    gridTemplateColumns: `repeat(${Math.min(cameraTracks.length, 5)}, 1fr)`,
                }}
            >
                {cameraTracks.map((trackRef) => (
                    <div key={trackRef.participant.identity} className={styles.participantWrapper}>
                        <ParticipantTile
                            trackRef={trackRef}
                            className={styles.participantTile}
                        />

                        {/* Perception value overlay */}
                        {showPerceptionOverlay && perceptionValues[trackRef.participant.identity] !== undefined && (
                            <div
                                className={styles.perceptionBadge}
                                style={{
                                    backgroundColor: getPerceptionColor(perceptionValues[trackRef.participant.identity]),
                                }}
                            >
                                {Math.round(perceptionValues[trackRef.participant.identity])}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function getPerceptionColor(value: number): string {
    if (value < 35) return 'var(--color-dial-negative)';
    if (value > 65) return 'var(--color-dial-positive)';
    return 'var(--color-dial-neutral)';
}

export default function VideoGrid({
    token,
    serverUrl,
    maxParticipants = 10,
    showPerceptionOverlay = false,
    perceptionValues = {},
    onRoomConnected,
    onRoomDisconnected,
}: VideoGridProps) {
    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            video={true}
            audio={true}
            className={styles.roomContainer}
        >
            <RoomDataHandler
                onRoomConnected={onRoomConnected}
                onRoomDisconnected={onRoomDisconnected}
            />
            <ParticipantDebugger />
            <ParticipantGrid
                maxParticipants={maxParticipants}
                showPerceptionOverlay={showPerceptionOverlay}
                perceptionValues={perceptionValues}
            />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}
