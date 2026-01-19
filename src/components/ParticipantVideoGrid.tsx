'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { useVisibilityPause } from '@/hooks/useVisibilityPause';
import { useToast } from '@/components/Toast';
import styles from './ParticipantVideoGrid.module.css';

interface ParticipantVideoGridProps {
    token: string;
    serverUrl: string;
    lowPowerMode?: boolean;  // Disables local video to save bandwidth
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
    const { showToast } = useToast();
    const prevState = useRef<ConnectionState | null>(null);

    useEffect(() => {
        if (!room) return;

        // Only show toast on state change
        if (prevState.current !== connectionState) {
            if (connectionState === ConnectionState.Connected) {
                console.log('[ParticipantGrid] Room CONNECTED');
                setRoom(room);
                onRoomConnected?.(room);
                if (prevState.current === ConnectionState.Reconnecting) {
                    showToast('Reconnected successfully', 'success');
                }
            } else if (connectionState === ConnectionState.Reconnecting) {
                showToast('Connection lost. Reconnecting...', 'warning', 0);
            } else if (connectionState === ConnectionState.Disconnected) {
                if (prevState.current === ConnectionState.Connected || prevState.current === ConnectionState.Reconnecting) {
                    showToast('Disconnected from session', 'error');
                }
                onRoomDisconnected?.();
            }
            prevState.current = connectionState;
        }
    }, [room, connectionState, onRoomConnected, onRoomDisconnected, showToast]);

    return null;
}

function ParticipantLayout({ lowPowerMode = false }: { lowPowerMode?: boolean }) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    // Auto-pause video when tab is hidden (saves bandwidth)
    useVisibilityPause(localParticipant);

    // Media presentation state (received from moderator)
    const [presentingMedia, setPresentingMedia] = useState<MediaItem | null>(null);

    // Hand raise state
    const [handRaised, setHandRaised] = useState(false);

    // Toggle hand raise and broadcast to room
    const toggleHandRaise = useCallback(() => {
        if (!room?.localParticipant) return;

        const newState = !handRaised;
        setHandRaised(newState);

        const encoder = new TextEncoder();
        const payload = encoder.encode(JSON.stringify({
            type: 'handRaise',
            participantId: localParticipant.identity,
            raised: newState
        }));
        room.localParticipant.publishData(payload, { reliable: true });
        console.log('[Participant] Hand raise:', newState);
    }, [room, handRaised, localParticipant]);

    // Muted by moderator state
    const [isMutedByMod, setIsMutedByMod] = useState(false);

    // Listen for data channel messages from moderator
    useEffect(() => {
        if (!room) return;

        const handleData = (payload: Uint8Array) => {
            try {
                const decoder = new TextDecoder();
                const data = JSON.parse(decoder.decode(payload));

                // Media presentation messages
                if (data.type === 'media') {
                    console.log('[Participant] Received media broadcast:', data);
                    if (data.action === 'present' && data.media) {
                        setPresentingMedia(data.media);
                    } else if (data.action === 'stop') {
                        setPresentingMedia(null);
                    }
                }

                // Hand raise clear message from moderator
                if (data.type === 'handRaiseClear' && data.participantId === localParticipant.identity) {
                    setHandRaised(false);
                    console.log('[Participant] Hand lowered by moderator');
                }

                // Mute command from moderator
                if (data.type === 'muteCommand') {
                    const isForMe = data.participantId === 'all' || data.participantId === localParticipant.identity;
                    if (isForMe) {
                        setIsMutedByMod(data.muted);
                        localParticipant.setMicrophoneEnabled(!data.muted);
                        console.log('[Participant] Muted by moderator:', data.muted);
                    }
                }
            } catch (e) {
                console.error('[Participant] Failed to parse data:', e);
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room, localParticipant]);

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
    let otherParticipants = remoteParticipantTracks.filter(
        t => t !== moderatorTrack
    );

    // LOW POWER MODE: Limit to max 2 other participants (4-grid: self + mod + 2 others)
    // This reduces incoming bandwidth/CPU, NOT the user's outgoing camera
    if (lowPowerMode && otherParticipants.length > 2) {
        // TODO: prioritize by recent speaking activity
        // For now, just take first 2
        otherParticipants = otherParticipants.slice(0, 2);
    }

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
                {/* Hand raise button */}
                <button
                    className={`${styles.handRaiseBtn} ${handRaised ? styles.handRaiseActive : ''}`}
                    onClick={toggleHandRaise}
                    title={handRaised ? 'Lower hand' : 'Raise hand to speak'}
                >
                    ✋
                </button>

                {/* Self view - first (left side) */}
                <div className={`${styles.selfTile} ${isMutedByMod ? styles.mutedBorder : ''}`}>
                    {localTrack?.publication?.track ? (
                        <VideoTrack
                            trackRef={localTrack}
                            className={styles.smallVideo}
                        />
                    ) : (
                        <div className={styles.smallPlaceholder}>📹</div>
                    )}
                    <span className={styles.smallLabel}>
                        You {lowPowerMode && '⚡'}
                    </span>
                    {/* Mute indicator */}
                    <span className={`${styles.micIndicator} ${isMutedByMod ? styles.micIndicatorMuted : ''}`}>
                        {isMutedByMod ? '🔇' : '🎤'}
                    </span>
                </div>

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
    lowPowerMode = false,
    onRoomConnected,
    onRoomDisconnected,
}: ParticipantVideoGridProps) {
    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            video={true}   // Camera ALWAYS on - participants must be visible
            audio={true}   // Audio always on
            className={styles.room}
        >
            <RoomHandler
                onRoomConnected={onRoomConnected}
                onRoomDisconnected={onRoomDisconnected}
            />
            <ParticipantLayout lowPowerMode={lowPowerMode} />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}
