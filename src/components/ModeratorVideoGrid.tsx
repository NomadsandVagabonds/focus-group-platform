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
    useParticipants,
    useIsSpeaking,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, Room, ConnectionState, Participant } from 'livekit-client';
import { setRoom } from '@/lib/livekit-data';
import { useVisibilityPause } from '@/hooks/useVisibilityPause';
import styles from './ModeratorVideoGrid.module.css';

interface ModeratorVideoGridProps {
    token: string;
    serverUrl: string;
    sessionId?: string;
    perceptionValues?: Record<string, number>;
    onRoomConnected?: (room: Room) => void;
    onRoomDisconnected?: () => void;
    onParticipantStateChange?: (state: {
        mutedParticipants: Set<string>;
        handRaises: Record<string, number>;
        connectedParticipants: string[];
    }) => void;
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

// Wrapper component to detect speaking state per participant
function SpeakingTile({ participant, children }: { participant: Participant; children: React.ReactNode }) {
    const isSpeaking = useIsSpeaking(participant);
    return (
        <div className={`${styles.participantTile} ${isSpeaking ? styles.speaking : ''}`}>
            {children}
        </div>
    );
}

function ModeratorLayout({
    perceptionValues = {},
    sessionId,
    onParticipantStateChange
}: {
    perceptionValues?: Record<string, number>;
    sessionId?: string;
    onParticipantStateChange?: (state: {
        mutedParticipants: Set<string>;
        handRaises: Record<string, number>;
        connectedParticipants: string[];
    }) => void;
}) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const participants = useParticipants();

    // Auto-pause video when tab is hidden (saves bandwidth)
    useVisibilityPause(localParticipant);

    // Timer state
    const [timerSeconds, setTimerSeconds] = useState(60 * 60); // 60 minutes
    const [isRunning, setIsRunning] = useState(false);

    // Media state
    interface MediaItem { id: string; filename: string; file_type: string; url: string; }
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [showMediaDropdown, setShowMediaDropdown] = useState(false);
    const [presentingMedia, setPresentingMedia] = useState<MediaItem | null>(null);

    // Hand raise tracking - participantId -> timestamp
    const [handRaises, setHandRaises] = useState<Record<string, number>>({});

    // Listen for hand raise data channel messages
    useEffect(() => {
        if (!room) return;

        const handleData = (payload: Uint8Array, participant?: { identity: string }) => {
            try {
                const decoder = new TextDecoder();
                const data = JSON.parse(decoder.decode(payload));
                if (data.type === 'handRaise') {
                    const participantId = participant?.identity || data.participantId;
                    if (data.raised) {
                        setHandRaises(prev => ({ ...prev, [participantId]: Date.now() }));
                    } else {
                        setHandRaises(prev => {
                            const next = { ...prev };
                            delete next[participantId];
                            return next;
                        });
                    }
                }
            } catch (e) {
                // Not JSON or not a hand raise message
            }
        };

        room.on('dataReceived', handleData);
        return () => { room.off('dataReceived', handleData); };
    }, [room]);

    // Muted participants tracking (local state for UI)
    const [mutedParticipants, setMutedParticipants] = useState<Set<string>>(new Set());
    const [modMuted, setModMuted] = useState(false);

    // Broadcast mute command to participants
    const broadcastMuteCommand = useCallback((participantId: string | 'all', muted: boolean) => {
        if (!room?.localParticipant) return;
        const encoder = new TextEncoder();
        const payload = encoder.encode(JSON.stringify({
            type: 'muteCommand',
            participantId,
            muted
        }));
        room.localParticipant.publishData(payload, { reliable: true });
    }, [room]);

    // Mute all participants (except self)
    const muteAll = useCallback(() => {
        if (!room) return;
        const allIds = new Set<string>();
        room.remoteParticipants.forEach(participant => {
            if (!participant.identity.toLowerCase().includes('moderator')) {
                allIds.add(participant.identity);
            }
        });
        setMutedParticipants(allIds);
        broadcastMuteCommand('all', true);
        console.log('[Moderator] Muted all participants');
    }, [room, broadcastMuteCommand]);

    // Unmute all participants
    const unmuteAll = useCallback(() => {
        setMutedParticipants(new Set());
        broadcastMuteCommand('all', false);
        console.log('[Moderator] Unmuted all participants');
    }, [broadcastMuteCommand]);

    // Toggle mute for a specific participant
    const toggleParticipantMute = useCallback((participantId: string) => {
        setMutedParticipants(prev => {
            const next = new Set(prev);
            if (next.has(participantId)) {
                next.delete(participantId);
                broadcastMuteCommand(participantId, false);
            } else {
                next.add(participantId);
                broadcastMuteCommand(participantId, true);
            }
            return next;
        });
    }, [broadcastMuteCommand]);

    // Toggle moderator's own mic (doesn't affect media)
    const toggleModMute = useCallback(() => {
        if (!localParticipant) return;
        const newMuted = !modMuted;
        setModMuted(newMuted);
        localParticipant.setMicrophoneEnabled(!newMuted);
        console.log('[Moderator] Self mute:', newMuted);
    }, [localParticipant, modMuted]);

    // Clear hand raise for a participant
    const clearHandRaise = useCallback((participantId: string) => {
        setHandRaises(prev => {
            const next = { ...prev };
            delete next[participantId];
            return next;
        });
        // Notify participant to lower hand
        if (room?.localParticipant) {
            const encoder = new TextEncoder();
            const payload = encoder.encode(JSON.stringify({
                type: 'handRaiseClear',
                participantId
            }));
            room.localParticipant.publishData(payload, { reliable: true });
        }
    }, [room]);

    // Report state changes to parent component
    useEffect(() => {
        if (!onParticipantStateChange) return;

        // Get list of connected participants (excluding moderator)
        const connectedParticipants = participants
            .filter(p => !p.identity.toLowerCase().includes('moderator'))
            .map(p => p.identity);

        onParticipantStateChange({
            mutedParticipants,
            handRaises,
            connectedParticipants
        });
    }, [mutedParticipants, handRaises, participants, onParticipantStateChange]);

    // Fetch media for this session
    useEffect(() => {
        if (!sessionId) return;
        fetch(`/api/session-media?sessionId=${sessionId}`)
            .then(res => res.ok ? res.json() : { media: [] })
            .then(data => setMedia(data.media || []))
            .catch(() => setMedia([]));
    }, [sessionId]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning && timerSeconds > 0) {
            interval = setInterval(() => setTimerSeconds(s => Math.max(0, s - 1)), 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isRunning, timerSeconds]);

    const toggleTimer = useCallback(() => setIsRunning(r => !r), []);
    const resetTimer = useCallback(() => { setIsRunning(false); setTimerSeconds(60 * 60); }, []);
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const toggleMediaDropdown = useCallback(() => setShowMediaDropdown(s => !s), []);

    // Broadcast media to all participants via data channel
    const broadcastMedia = useCallback((mediaData: { action: 'present' | 'stop'; media?: MediaItem }) => {
        if (!room?.localParticipant) return;
        const encoder = new TextEncoder();
        const payload = encoder.encode(JSON.stringify({ type: 'media', ...mediaData }));
        room.localParticipant.publishData(payload, { reliable: true });
        console.log('[Media] Broadcast:', mediaData);
    }, [room]);

    const presentMedia = useCallback((item: MediaItem) => {
        setPresentingMedia(item);
        setShowMediaDropdown(false);
        broadcastMedia({ action: 'present', media: item });
    }, [broadcastMedia]);

    const stopPresenting = useCallback(() => {
        setPresentingMedia(null);
        broadcastMedia({ action: 'stop' });
    }, [broadcastMedia]);

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

    // Calculate grid layout: 2x2 (4 slots) → 3x2 (6 slots) → 3x3 (9 slots)
    const getGridConfig = (count: number) => {
        if (count <= 4) return { cols: 2, rows: 2, total: 4 };   // 2x2
        if (count <= 6) return { cols: 3, rows: 2, total: 6 };   // 3x2
        return { cols: 3, rows: 3, total: 9 };                    // 3x3
    };

    const participantCount = remoteParticipantTracks.length;
    const gridConfig = getGridConfig(participantCount);

    // Create array of slots - fill with participants, rest are empty placeholders
    const slots = Array.from({ length: gridConfig.total }, (_, i) => {
        if (i < remoteParticipantTracks.length) {
            return { type: 'participant' as const, trackRef: remoteParticipantTracks[i] };
        }
        return { type: 'empty' as const, trackRef: null };
    });

    // Count active hand raises
    const handRaiseCount = Object.keys(handRaises).length;

    return (
        <div className={styles.container}>
            {/* Main area - Participant grid */}
            <div className={styles.mainArea}>
                <div
                    className={styles.participantGrid}
                    style={{
                        gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`
                    }}
                >
                    {slots.map((slot, index) => {
                        if (slot.type === 'participant' && slot.trackRef) {
                            const trackRef = slot.trackRef;
                            const participantId = trackRef.participant.identity;
                            const hasHandRaised = !!handRaises[participantId];
                            const isMuted = mutedParticipants.has(participantId);

                            return (
                                <SpeakingTile key={participantId} participant={trackRef.participant}>
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

                                    {/* Hand raise indicator - click to clear */}
                                    {hasHandRaised && (
                                        <button
                                            className={styles.handRaiseIndicator}
                                            onClick={() => clearHandRaise(participantId)}
                                            title="Click to lower hand"
                                        >
                                            ✋
                                        </button>
                                    )}

                                    {/* Mic control - click to toggle mute */}
                                    <button
                                        className={`${styles.micControl} ${isMuted ? styles.micMuted : ''}`}
                                        onClick={() => toggleParticipantMute(participantId)}
                                        title={isMuted ? 'Click to unmute' : 'Click to mute'}
                                    >
                                        {isMuted ? '🔇' : '🎤'}
                                    </button>

                                    {/* Perception badge - bottom right */}
                                    {perceptionValues[participantId] !== undefined && (
                                        <span
                                            className={styles.perceptionBadge}
                                            style={{
                                                backgroundColor: getPerceptionColor(perceptionValues[participantId])
                                            }}
                                        >
                                            {Math.round(perceptionValues[participantId])}
                                        </span>
                                    )}

                                    {/* Name - top bar */}
                                    <div className={styles.participantInfo}>
                                        <span className={styles.name}>
                                            {participantId}
                                        </span>
                                    </div>
                                </SpeakingTile>
                            );
                        }
                        // Empty slot placeholder
                        return (
                            <div key={`empty-${index}`} className={styles.emptySlot}>
                                <div className={styles.emptyIcon}>👤</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Moderator control strip - integrated at bottom of video grid */}
            <div className={styles.moderatorStrip}>
                {/* Self-view OR presenting media */}
                <div className={styles.selfView}>
                    {presentingMedia ? (
                        // Show presenting media in the self-view slot
                        <div className={styles.mediaPresentation}>
                            {presentingMedia.file_type === 'image' && (
                                <img src={presentingMedia.url} alt={presentingMedia.filename} className={styles.presentedMedia} />
                            )}
                            {presentingMedia.file_type === 'video' && (
                                <video
                                    src={presentingMedia.url}
                                    controls
                                    autoPlay
                                    className={styles.presentedMedia}
                                    onEnded={stopPresenting}
                                />
                            )}
                            {presentingMedia.file_type === 'audio' && (
                                <div className={styles.audioPresentation}>
                                    <span>🔊</span>
                                    <audio src={presentingMedia.url} controls autoPlay onEnded={stopPresenting} />
                                </div>
                            )}
                            {presentingMedia.file_type === 'pdf' && (
                                <iframe src={presentingMedia.url} className={styles.presentedMedia} title={presentingMedia.filename} />
                            )}
                            <span className={styles.selfLabel}>▶️ {presentingMedia.filename}</span>
                        </div>
                    ) : localTrack && localTrack.publication?.track ? (
                        // Show camera when not presenting
                        <>
                            <VideoTrack
                                trackRef={localTrack}
                                className={styles.selfVideo}
                            />
                            <span className={styles.selfLabel}>You (Moderator)</span>
                        </>
                    ) : (
                        <>
                            <div className={styles.selfPlaceholder}>📹</div>
                            <span className={styles.selfLabel}>You (Moderator)</span>
                        </>
                    )}
                </div>

                {/* Notepad - no title, just placeholder */}
                <div className={styles.notepadContainer}>
                    <textarea
                        className={styles.notepad}
                        placeholder="Take notes during the session..."
                    />
                </div>

                {/* Timer - functional */}
                <div className={styles.timerContainer}>
                    <div className={styles.timerDisplay} style={{ color: timerSeconds <= 300 ? (timerSeconds <= 60 ? '#fc8181' : '#f6ad55') : '#e2e8f0' }}>
                        {formatTime(timerSeconds)}
                    </div>
                    <div className={styles.timerButtons}>
                        <button
                            className={isRunning ? styles.timerBtnStop : styles.timerBtn}
                            onClick={toggleTimer}
                        >
                            {isRunning ? 'STOP' : 'START'}
                        </button>
                        <button className={styles.timerBtnSecondary} onClick={resetTimer}>RESET</button>
                    </div>
                </div>

                {/* Audio Controls */}
                <div className={styles.audioControls}>
                    {/* Moderator self-mute */}
                    <button
                        className={`${styles.modMuteBtn} ${modMuted ? styles.modMuted : ''}`}
                        onClick={toggleModMute}
                        title={modMuted ? 'Unmute yourself' : 'Mute yourself'}
                    >
                        {modMuted ? '🔇 Mic Off' : '🎤 Mic On'}
                    </button>

                    {handRaiseCount > 0 && (
                        <span className={styles.handRaiseCount}>
                            ✋ {handRaiseCount}
                        </span>
                    )}
                    <div className={styles.audioButtons}>
                        <button
                            className={styles.muteBtn}
                            onClick={muteAll}
                            title="Mute all participants"
                        >
                            🔇 Mute All
                        </button>
                        <button
                            className={styles.unmuteBtn}
                            onClick={unmuteAll}
                            title="Unmute all participants"
                        >
                            🔊 Unmute All
                        </button>
                    </div>
                </div>

                {/* Media Library - inline scrollable list */}
                <div className={styles.mediaLibrary}>
                    <div className={styles.mediaLibraryHeader}>
                        📁 Media ({media.length})
                        {presentingMedia && (
                            <button className={styles.stopPresentingSmall} onClick={stopPresenting}>
                                ⏹ Stop
                            </button>
                        )}
                    </div>
                    <div className={styles.mediaList}>
                        {media.length === 0 ? (
                            <div className={styles.mediaEmpty}>No media</div>
                        ) : (
                            media.map(item => (
                                <div
                                    key={item.id}
                                    className={`${styles.mediaItem} ${presentingMedia?.id === item.id ? styles.mediaItemActive : ''}`}
                                    onClick={() => presentMedia(item)}
                                    title={item.filename}
                                >
                                    {item.file_type === 'image' ? '🖼️' :
                                        item.file_type === 'video' ? '🎬' :
                                            item.file_type === 'audio' ? '🔊' : '📄'}
                                    <span className={styles.mediaItemName}>{item.filename}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
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
    sessionId,
    perceptionValues = {},
    onRoomConnected,
    onRoomDisconnected,
    onParticipantStateChange,
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
            <ModeratorLayout
                perceptionValues={perceptionValues}
                sessionId={sessionId}
                onParticipantStateChange={onParticipantStateChange}
            />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}
