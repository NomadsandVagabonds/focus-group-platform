'use client';

import React from 'react';
import CountdownTimer from './CountdownTimer';
import ModeratorNotepad from './ModeratorNotepad';
import { LocalVideoTrack } from 'livekit-client';

interface Props {
    localVideoTrack?: LocalVideoTrack;
    onNotesChange?: (notes: string) => void;
    sessionNotes?: string;
}

export default function ModeratorControlBar({ localVideoTrack, onNotesChange, sessionNotes }: Props) {
    // Reference for self-view video
    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Attach local video when available
    React.useEffect(() => {
        if (localVideoTrack && videoRef.current) {
            localVideoTrack.attach(videoRef.current);
            return () => {
                localVideoTrack.detach(videoRef.current!);
            };
        }
    }, [localVideoTrack]);

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(180deg, #1A1A2E 0%, #0d0d1a 100%)',
            borderTop: '1px solid #2d3748',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '16px',
            zIndex: 100
        }}>
            {/* Self-view */}
            <div style={{
                width: '120px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{
                    width: '100px',
                    height: '56px',
                    background: '#2d3748',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '2px solid #9A3324'
                }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
                <span style={{ color: '#a0aec0', fontSize: '9px', marginTop: '4px' }}>YOU (Moderator)</span>
            </div>

            {/* Notepad */}
            <div style={{ width: '200px', flexShrink: 0, height: '80px' }}>
                <ModeratorNotepad
                    onNotesChange={onNotesChange}
                    initialNotes={sessionNotes}
                />
            </div>

            {/* Timer */}
            <div style={{
                width: '150px',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center'
            }}>
                <CountdownTimer initialMinutes={60} />
            </div>

            {/* Media Browser - placeholder for now */}
            <div style={{
                flex: 1,
                height: '80px',
                background: '#2d3748',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#718096',
                fontSize: '12px'
            }}>
                📁 Media Library (coming soon)
            </div>
        </div>
    );
}
