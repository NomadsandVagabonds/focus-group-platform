'use client';

import { useEffect, useRef, useState } from 'react';
import { LocalParticipant, Track } from 'livekit-client';

/**
 * Hook to auto-pause video/audio when browser tab is hidden.
 * Saves significant bandwidth when users leave tabs open.
 * 
 * Usage:
 *   useVisibilityPause(localParticipant);
 */
export function useVisibilityPause(localParticipant: LocalParticipant | undefined) {
    const [isTabHidden, setIsTabHidden] = useState(false);
    const wasVideoEnabled = useRef(false);
    const wasAudioEnabled = useRef(false);

    useEffect(() => {
        if (!localParticipant) return;

        const handleVisibilityChange = () => {
            const hidden = document.hidden;
            setIsTabHidden(hidden);

            if (hidden) {
                // Tab became hidden - save current state and pause
                const videoTrack = localParticipant.getTrackPublication(Track.Source.Camera);
                const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone);

                wasVideoEnabled.current = videoTrack?.isMuted === false;
                wasAudioEnabled.current = audioTrack?.isMuted === false;

                // Mute tracks to stop sending data
                if (wasVideoEnabled.current && videoTrack?.track) {
                    videoTrack.track.mute();
                    console.log('[VisibilityPause] Tab hidden - Video paused');
                }
                // Keep audio - user might want to hear even in background
                // Uncomment below to also pause audio:
                // if (wasAudioEnabled.current && audioTrack?.track) {
                //     audioTrack.track.mute();
                //     console.log('[VisibilityPause] Tab hidden - Audio paused');
                // }
            } else {
                // Tab became visible - restore previous state
                const videoTrack = localParticipant.getTrackPublication(Track.Source.Camera);
                // const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone);

                if (wasVideoEnabled.current && videoTrack?.track) {
                    videoTrack.track.unmute();
                    console.log('[VisibilityPause] Tab visible - Video resumed');
                }
                // Uncomment to restore audio:
                // if (wasAudioEnabled.current && audioTrack?.track) {
                //     audioTrack.track.unmute();
                //     console.log('[VisibilityPause] Tab visible - Audio resumed');
                // }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [localParticipant]);

    return { isTabHidden };
}

export default useVisibilityPause;
