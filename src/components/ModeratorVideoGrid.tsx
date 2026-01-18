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
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, Room, ConnectionState, Participant } from 'livekit-client';
import { setRoom } from '@/lib/livekit-data';
import styles from './ModeratorVideoGrid.module.css';

interface ModeratorVideoGridProps {
    token: string;
    serverUrl: string;
    sessionId?: string;
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

function ModeratorLayout({ perceptionValues = {}, sessionId }: { perceptionValues?: Record<string, number>; sessionId?: string }) {
    const { localParticipant } = useLocalParticipant();
    const participants = useParticipants();

    // Timer state
    const [timerSeconds, setTimerSeconds] = useState(60 * 60); // 60 minutes
    const [isRunning, setIsRunning] = useState(false);

    // Media state
    interface MediaItem { id: string; filename: string; file_type: string; url: string; }
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [showMediaDropdown, setShowMediaDropdown] = useState(false);
    const [presentingMedia, setPresentingMedia] = useState<MediaItem | null>(null);

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
    const presentMedia = useCallback((item: MediaItem) => {
        setPresentingMedia(item);
        setShowMediaDropdown(false);
    }, []);
    const stopPresenting = useCallback(() => setPresentingMedia(null), []);

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
                            return (
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
                {/* Self-view */}
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

                {/* Media Browser - clickable with dropdown */}
                <div className={styles.mediaBrowserWrapper}>
                    <div className={styles.mediaBrowser} onClick={toggleMediaDropdown}>
                        <span className={styles.mediaIcon}>{presentingMedia ? '▶️' : '📁'}</span>
                        <span className={styles.mediaLabel}>{presentingMedia ? presentingMedia.filename : 'Media Library'}</span>
                        <span className={styles.mediaStatus}>
                            {presentingMedia ? '(presenting)' : `${media.length} items`}
                        </span>
                    </div>

                    {/* Dropdown list */}
                    {showMediaDropdown && (
                        <div className={styles.mediaDropdown}>
                            {presentingMedia && (
                                <div className={styles.mediaDropdownItem} onClick={stopPresenting} style={{ color: '#fc8181' }}>
                                    ⏹ Stop Presenting
                                </div>
                            )}
                            {media.length === 0 ? (
                                <div className={styles.mediaDropdownEmpty}>No media uploaded</div>
                            ) : (
                                media.map(item => (
                                    <div
                                        key={item.id}
                                        className={styles.mediaDropdownItem}
                                        onClick={() => presentMedia(item)}
                                    >
                                        {item.file_type === 'image' ? '🖼️' :
                                            item.file_type === 'video' ? '🎬' :
                                                item.file_type === 'audio' ? '🔊' :
                                                    item.file_type === 'pdf' ? '📄' : '📁'} {item.filename}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Presentation Overlay - shows on top when presenting media */}
            {presentingMedia && (
                <div className={styles.presentationOverlay}>
                    <button className={styles.stopPresentingBtn} onClick={stopPresenting}>
                        ✕ Stop Presenting
                    </button>
                    {presentingMedia.file_type === 'image' && (
                        <img src={presentingMedia.url} alt={presentingMedia.filename} className={styles.presentedImage} />
                    )}
                    {presentingMedia.file_type === 'video' && (
                        <video src={presentingMedia.url} controls autoPlay className={styles.presentedVideo} onEnded={stopPresenting} />
                    )}
                    {presentingMedia.file_type === 'audio' && (
                        <div className={styles.presentedAudio}>
                            <span>🔊 {presentingMedia.filename}</span>
                            <audio src={presentingMedia.url} controls autoPlay onEnded={stopPresenting} />
                        </div>
                    )}
                    {presentingMedia.file_type === 'pdf' && (
                        <iframe src={presentingMedia.url} className={styles.presentedPdf} title={presentingMedia.filename} />
                    )}
                </div>
            )}
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
            <ModeratorLayout perceptionValues={perceptionValues} sessionId={sessionId} />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}
