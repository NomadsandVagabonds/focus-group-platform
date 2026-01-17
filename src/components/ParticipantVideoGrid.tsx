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
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, Room, ConnectionState } from 'livekit-client';
import { setRoom } from '@/lib/livekit-data';
import styles from './ParticipantVideoGrid.module.css';

interface ParticipantVideoGridProps {
    token: string;
    serverUrl: string;
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
            console.log('[ParticipantGrid] Room CONNECTED');
            setRoom(room);
            onRoomConnected?.(room);
        } else if (connectionState === ConnectionState.Disconnected) {
            onRoomDisconnected?.();
        }
    }, [room, connectionState, onRoomConnected, onRoomDisconnected]);

    return null;
}

function ParticipantLayout() {
    const { localParticipant } = useLocalParticipant();

    // Get all camera tracks
    const tracks = useTracks(
        [{ source: Track.Source.Camera, withPlaceholder: true }],
        { onlySubscribed: false }
    );

    // Find moderator (first remote participant) and self
    const remoteParticipantTracks = tracks.filter(
        t => t.participant.identity !== localParticipant.identity
    );
    const localTrack = tracks.find(
        t => t.participant.identity === localParticipant.identity
    );

    // Moderator is the featured participant (first remote)
    const moderatorTrack = remoteParticipantTracks.find(
        t => t.participant.identity.includes('moderator')
    ) || remoteParticipantTracks[0];

    // Other participants (excluding moderator)
    const otherParticipants = remoteParticipantTracks.filter(
        t => t !== moderatorTrack
    );

    console.log('[ParticipantGrid] Moderator track:', moderatorTrack?.participant.identity);
    console.log('[ParticipantGrid] Other participants:', otherParticipants.length);
    console.log('[ParticipantGrid] Local track:', localTrack?.participant.identity);

    return (
        <div className={styles.container}>
            {/* Main area - Moderator/Featured video */}
            <div className={styles.mainArea}>
                {moderatorTrack ? (
                    <div className={styles.featuredTile}>
                        {moderatorTrack.publication?.track ? (
                            <VideoTrack
                                trackRef={moderatorTrack}
                                className={styles.video}
                            />
                        ) : (
                            <div className={styles.placeholder}>
                                <div className={styles.avatar}>👤</div>
                                <span>Moderator camera off</span>
                            </div>
                        )}
                        <div className={styles.participantInfo}>
                            <span className={styles.name}>
                                {moderatorTrack.participant.identity}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className={styles.waitingMessage}>
                        <span>Waiting for moderator...</span>
                    </div>
                )}
            </div>

            {/* Bottom bar - Self + other participants */}
            <div className={styles.bottomBar}>
                {/* Self view - first (left side) */}
                {localTrack && (
                    <div className={styles.selfTile}>
                        {localTrack.publication?.track ? (
                            <VideoTrack
                                trackRef={localTrack}
                                className={styles.smallVideo}
                            />
                        ) : (
                            <div className={styles.smallPlaceholder}>📹</div>
                        )}
                        <span className={styles.smallLabel}>You</span>
                    </div>
                )}

                {/* Other participants */}
                {otherParticipants.map((trackRef) => (
                    <div key={trackRef.participant.identity} className={styles.smallTile}>
                        {trackRef.publication?.track ? (
                            <VideoTrack
                                trackRef={trackRef}
                                className={styles.smallVideo}
                            />
                        ) : (
                            <div className={styles.smallPlaceholder}>👤</div>
                        )}
                        <span className={styles.smallLabel}>
                            {trackRef.participant.identity.split('-')[0]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ParticipantVideoGrid({
    token,
    serverUrl,
    onRoomConnected,
    onRoomDisconnected,
}: ParticipantVideoGridProps) {
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
            <ParticipantLayout />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}
