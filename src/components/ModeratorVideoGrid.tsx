'use client';

import React, { useEffect } from 'react';
import {
    LiveKitRoom,
    VideoTrack,
    useTracks,
    RoomAudioRenderer,
    useRoomContext,
    useConnectionState,
    useLocalParticipant,
    useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, Room, ConnectionState, Participant } from 'livekit-client';
import { setRoom } from '@/lib/livekit-data';
import styles from './ModeratorVideoGrid.module.css';

interface ModeratorVideoGridProps {
    token: string;
    serverUrl: string;
    perceptionValues?: Record<string, number>;
    onRoomConnected?: (room: Room) => void;
    onRoomDisconnected?: () => void;
}

function RoomHandler({
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

        if (connectionState === ConnectionState.Connected) {
            console.log('[ModeratorGrid] Room CONNECTED');
            setRoom(room);
            onRoomConnected?.(room);
        } else if (connectionState === ConnectionState.Disconnected) {
            onRoomDisconnected?.();
        }
    }, [room, connectionState, onRoomConnected, onRoomDisconnected]);

    return null;
}

function ModeratorLayout({ perceptionValues = {} }: { perceptionValues?: Record<string, number> }) {
    const { localParticipant } = useLocalParticipant();
    const participants = useParticipants();

    // Get all camera tracks
    const tracks = useTracks(
        [{ source: Track.Source.Camera, withPlaceholder: true }],
        { onlySubscribed: false }
    );

    // Separate local (moderator) from remote (participants)
    // Filter out: local participant OR anyone with "moderator" in their identity
    const remoteParticipantTracks = tracks.filter(
        t => t.participant.identity !== localParticipant.identity &&
            !t.participant.identity.toLowerCase().includes('moderator')
    );
    const localTrack = tracks.find(
        t => t.participant.identity === localParticipant.identity ||
            t.participant.identity.toLowerCase().includes('moderator')
    );

    console.log('[ModeratorGrid] Local identity:', localParticipant.identity);
    console.log('[ModeratorGrid] Remote participants:', remoteParticipantTracks.map(t => t.participant.identity));
    console.log('[ModeratorGrid] Local track:', !!localTrack);

    // Calculate grid columns based on participant count
    // Always show grid format, never single full-screen
    const getGridColumns = (count: number) => {
        if (count <= 0) return 1;
        if (count === 1) return 1; // Single participant but styled smaller
        if (count <= 4) return 2;  // 2x2 for 2-4 participants
        if (count <= 9) return 3;  // 3x3 for 5-9 participants
        return 4;                   // 4 columns for 10+
    };

    const participantCount = remoteParticipantTracks.length;
    const gridCols = getGridColumns(participantCount);

    return (
        <div className={styles.container}>
            {/* Main area - Participant grid */}
            <div className={styles.mainArea}>
                {remoteParticipantTracks.length > 0 ? (
                    <div
                        className={styles.participantGrid}
                        data-count={participantCount}
                        style={{
                            gridTemplateColumns: `repeat(${gridCols}, 1fr)`
                        }}
                    >
                        {remoteParticipantTracks.map((trackRef) => (
                            <div key={trackRef.participant.identity} className={styles.participantTile}>
                                {trackRef.publication?.track ? (
                                    <VideoTrack
                                        trackRef={trackRef}
                                        className={styles.video}
                                    />
                                ) : (
                                    <div className={styles.placeholder}>
                                        <div className={styles.avatar}>👤</div>
                                    </div>
                                )}
                                <div className={styles.participantInfo}>
                                    <span className={styles.name}>
                                        {trackRef.participant.identity}
                                    </span>
                                    {perceptionValues[trackRef.participant.identity] !== undefined && (
                                        <span
                                            className={styles.perceptionBadge}
                                            style={{
                                                backgroundColor: getPerceptionColor(perceptionValues[trackRef.participant.identity])
                                            }}
                                        >
                                            {Math.round(perceptionValues[trackRef.participant.identity])}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.waitingMessage}>
                        <span>Waiting for participants to join...</span>
                    </div>
                )}
            </div>

            {/* Moderator strip - dedicated area below grid, not overlapping */}
            <div className={styles.moderatorStrip}>
                {localTrack && (
                    <div className={styles.selfView}>
                        {localTrack.publication?.track ? (
                            <VideoTrack
                                trackRef={localTrack}
                                className={styles.selfVideo}
                            />
                        ) : (
                            <div className={styles.selfPlaceholder}>📹</div>
                        )}
                        <span className={styles.selfLabel}>You (Moderator)</span>
                    </div>
                )}
                <span className={styles.moderatorStatus}>
                    {remoteParticipantTracks.length === 0
                        ? 'Waiting for participants...'
                        : `${remoteParticipantTracks.length} participant${remoteParticipantTracks.length !== 1 ? 's' : ''} connected`
                    }
                </span>
            </div>
        </div>
    );
}

function getPerceptionColor(value: number): string {
    if (value < 35) return '#ef4444';
    if (value > 65) return '#22c55e';
    return '#f97316';
}

export default function ModeratorVideoGrid({
    token,
    serverUrl,
    perceptionValues = {},
    onRoomConnected,
    onRoomDisconnected,
}: ModeratorVideoGridProps) {
    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            video={true}
            audio={true}
            className={styles.room}
        >
            <RoomHandler
                onRoomConnected={onRoomConnected}
                onRoomDisconnected={onRoomDisconnected}
            />
            <ModeratorLayout perceptionValues={perceptionValues} />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}
