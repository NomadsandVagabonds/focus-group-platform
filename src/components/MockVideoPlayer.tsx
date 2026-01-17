'use client';

import React, { useRef, useEffect, useState } from 'react';
import styles from './MockVideoPlayer.module.css';

interface MockVideoPlayerProps {
    /** URL of media to play (video or image) */
    mediaSrc?: string;
    /** Show local webcam preview */
    showLocalWebcam?: boolean;
    /** Callback when media timestamp changes (for sync) */
    onTimeUpdate?: (timestamp: number) => void;
    /** Show placeholder for demo mode */
    showPlaceholder?: boolean;
    /** Placeholder image URL */
    placeholderImage?: string;
}

export default function MockVideoPlayer({
    mediaSrc,
    showLocalWebcam = true,
    onTimeUpdate,
    showPlaceholder = true,
    placeholderImage,
}: MockVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const webcamRef = useRef<HTMLVideoElement>(null);
    const [hasWebcamPermission, setHasWebcamPermission] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Request webcam access for local preview
    useEffect(() => {
        if (!showLocalWebcam) return;

        async function requestWebcam() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false  // Don't need audio for preview
                });
                if (webcamRef.current) {
                    webcamRef.current.srcObject = stream;
                    setHasWebcamPermission(true);
                }
            } catch (err) {
                console.log('Webcam access denied or not available:', err);
                setHasWebcamPermission(false);
            }
        }

        requestWebcam();

        return () => {
            // Cleanup webcam stream
            if (webcamRef.current?.srcObject) {
                const stream = webcamRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [showLocalWebcam]);

    // Handle media time updates
    useEffect(() => {
        if (!videoRef.current || !onTimeUpdate) return;

        const handleTimeUpdate = () => {
            if (videoRef.current) {
                onTimeUpdate(videoRef.current.currentTime * 1000);
            }
        };

        videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
            videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [onTimeUpdate]);

    return (
        <div className={styles.container}>
            {/* Main content area */}
            <div className={styles.mainMedia}>
                {mediaSrc ? (
                    <video
                        ref={videoRef}
                        className={styles.video}
                        src={mediaSrc}
                        controls
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                ) : showPlaceholder ? (
                    <div className={styles.placeholder}>
                        {placeholderImage ? (
                            <img src={placeholderImage} alt="Media content" className={styles.placeholderImage} />
                        ) : (
                            <>
                                <div className={styles.placeholderIcon}>🎬</div>
                                <p className={styles.placeholderText}>Media will appear here</p>
                                <p className={styles.placeholderSubtext}>The moderator will share content for you to rate</p>
                            </>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Local webcam preview (picture-in-picture style) */}
            {showLocalWebcam && (
                <div className={styles.webcamPreview}>
                    {hasWebcamPermission ? (
                        <video
                            ref={webcamRef}
                            className={styles.webcamVideo}
                            autoPlay
                            playsInline
                            muted
                        />
                    ) : (
                        <div className={styles.webcamPlaceholder}>
                            <span>📷</span>
                            <span className={styles.webcamLabel}>You</span>
                        </div>
                    )}
                </div>
            )}

            {/* Playing indicator */}
            {isPlaying && (
                <div className={styles.playingIndicator}>
                    ▶ Playing
                </div>
            )}
        </div>
    );
}
