'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { Track, Room, ConnectionState, DataPacket_Kind, RoomEvent } from 'livekit-client';
import { setRoom } from '@/lib/livekit-data';
import styles from './ParticipantVideoGrid.module.css';

interface ParticipantVideoGridProps {
    token: string;
    serverUrl: string;
    onRoomConnected?: (room: Room) => void;
    onRoomDisconnected?: () => void;
}

interface MediaItem {
    id: string;
    filename: string;
    file_type: string;
    url: string;
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
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    // Media presentation state (received from moderator)
    const [presentingMedia, setPresentingMedia] = useState<MediaItem | null>(null);

    // Listen for data channel messages from moderator
    useEffect(() => {
        if (!room) return;

        const handleData = (payload: Uint8Array) => {
            try {
                const decoder = new TextDecoder();
                const data = JSON.parse(decoder.decode(payload));
                if (data.type === 'media') {
                    console.log('[Participant] Received media broadcast:', data);
                    if (data.action === 'present' && data.media) {
                        setPresentingMedia(data.media);
                    } else if (data.action === 'stop') {
                        setPresentingMedia(null);
                    }
                }
            } catch (e) {
                console.error('[Participant] Failed to parse data:', e);
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room]);

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

    return (
        <div className={styles.container}>
            {/* Media Overlay - shows when moderator is presenting */}
            {presentingMedia && (
                <div className={styles.mediaOverlay}>
                    {presentingMedia.file_type === 'image' && (
                        <img src={presentingMedia.url} alt={presentingMedia.filename} className={styles.overlayMedia} />
                    )}
                    {presentingMedia.file_type === 'video' && (
                        <video src={presentingMedia.url} autoPlay controls={false} className={styles.overlayMedia} />
                    )}
                    {presentingMedia.file_type === 'audio' && (
                        <div className={styles.overlayAudio}>
                            <span style={{ fontSize: '4rem' }}>🔊</span>
                            <audio src={presentingMedia.url} autoPlay />
                            <span>{presentingMedia.filename}</span>
                        </div>
                    )}
                    {presentingMedia.file_type === 'pdf' && (
                        <iframe src={presentingMedia.url} className={styles.overlayPdf} title={presentingMedia.filename} />
                    )}
                </div>
            )}

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
