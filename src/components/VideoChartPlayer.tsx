'use client';

import React, { useState, useRef, useEffect } from 'react';
import TranscriptOverlay from './TranscriptOverlay';

interface SliderEvent {
    participantId: string;
    value: number;
    timestamp: number;
    sessionMs: number;
}

interface AggregatePoint {
    sessionMs: number;
    mean: number;
    min: number;
    max: number;
    count: number;
}

interface TranscriptWord {
    word: string;
    start: number;
    end: number;
}

interface Props {
    videoUrl: string;
    events: SliderEvent[];
    aggregates: AggregatePoint[];
    durationMs: number;
    transcriptWords?: TranscriptWord[];
}

export default function VideoChartPlayer({ videoUrl, events, aggregates, durationMs, transcriptWords }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTimeMs, setCurrentTimeMs] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Update current time when video plays
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTimeMs(video.currentTime * 1000);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    // Calculate current average at playhead
    const getCurrentValue = () => {
        if (aggregates.length === 0) return 50;
        const point = aggregates.find(a => a.sessionMs >= currentTimeMs) || aggregates[aggregates.length - 1];
        return Math.round(point.mean);
    };

    // Chart dimensions
    const chartWidth = 700;
    const chartHeight = 120;
    const padding = 40;

    const maxMs = durationMs || Math.max(...aggregates.map(a => a.sessionMs), 1);
    const xScale = (ms: number) => padding + (ms / maxMs) * (chartWidth - padding * 2);
    const yScale = (val: number) => chartHeight - 25 - (val / 100) * (chartHeight - 45);

    // Get path up to current time (animated reveal)
    const getAnimatedPath = () => {
        const visiblePoints = aggregates.filter(a => a.sessionMs <= currentTimeMs);
        if (visiblePoints.length < 2) return '';
        return visiblePoints.map((a, i) =>
            `${i === 0 ? 'M' : 'L'} ${xScale(a.sessionMs)} ${yScale(a.mean)}`
        ).join(' ');
    };

    // Get full path (faded)
    const getFullPath = () => {
        if (aggregates.length < 2) return '';
        return aggregates.map((a, i) =>
            `${i === 0 ? 'M' : 'L'} ${xScale(a.sessionMs)} ${yScale(a.mean)}`
        ).join(' ');
    };

    // Click on chart to seek
    const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const relativeX = (x - padding) / (chartWidth - padding * 2);
        const seekTime = Math.max(0, Math.min(1, relativeX)) * (durationMs / 1000);
        video.currentTime = seekTime;
    };

    const formatTime = (ms: number) => {
        const secs = Math.floor(ms / 1000);
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#9A3324', marginBottom: '12px', fontSize: '1rem', fontWeight: 600 }}>
                Session Replay
            </h3>

            {/* Video Player */}
            <div style={{
                background: '#1A1A2E',
                borderRadius: '8px 8px 0 0',
                overflow: 'hidden'
            }}>
                <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    style={{
                        width: '100%',
                        display: 'block',
                        maxHeight: '400px'
                    }}
                />
            </div>

            {/* Transcript Overlay (karaoke-style) */}
            {transcriptWords && transcriptWords.length > 0 && (
                <TranscriptOverlay
                    words={transcriptWords}
                    currentTimeSeconds={currentTimeMs / 1000}
                />
            )}

            {/* Synced Chart */}
            <div style={{
                background: '#F7FAFC',
                padding: '12px 16px',
                borderRadius: '0 0 8px 8px',
                border: '1px solid #E2E8F0',
                borderTop: 'none'
            }}>
                {/* Current stats */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ color: '#718096', fontSize: '12px' }}>
                            {formatTime(currentTimeMs)} / {formatTime(durationMs)}
                        </span>
                        <span style={{
                            color: getCurrentValue() < 35 ? '#e53e3e' : getCurrentValue() > 65 ? '#38a169' : '#718096',
                            fontWeight: 600,
                            fontSize: '14px'
                        }}>
                            Current Avg: {getCurrentValue()}
                        </span>
                    </div>
                    <span style={{ color: '#718096', fontSize: '11px' }}>
                        Click chart to seek
                    </span>
                </div>

                {/* Interactive Chart */}
                <svg
                    width="100%"
                    height={chartHeight}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    style={{ cursor: 'pointer' }}
                    onClick={handleChartClick}
                >
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map(v => (
                        <g key={v}>
                            <line
                                x1={padding}
                                y1={yScale(v)}
                                x2={chartWidth - padding}
                                y2={yScale(v)}
                                stroke="#E2E8F0"
                                strokeDasharray="2,2"
                            />
                            <text x={padding - 6} y={yScale(v) + 3} fill="#718096" fontSize="9" textAnchor="end">
                                {v}
                            </text>
                        </g>
                    ))}

                    {/* Full path (faded) */}
                    <path
                        d={getFullPath()}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="2"
                    />

                    {/* Animated path (revealed) */}
                    <path
                        d={getAnimatedPath()}
                        fill="none"
                        stroke="#9A3324"
                        strokeWidth="2.5"
                    />

                    {/* Playhead */}
                    <line
                        x1={xScale(currentTimeMs)}
                        y1={yScale(100)}
                        x2={xScale(currentTimeMs)}
                        y2={yScale(0)}
                        stroke="#9A3324"
                        strokeWidth="2"
                        opacity="0.8"
                    />
                    <circle
                        cx={xScale(currentTimeMs)}
                        cy={yScale(getCurrentValue())}
                        r="5"
                        fill="#9A3324"
                        stroke="white"
                        strokeWidth="2"
                    />

                    {/* Time labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                        <text
                            key={pct}
                            x={xScale(pct * maxMs)}
                            y={chartHeight - 5}
                            fill="#718096"
                            fontSize="9"
                            textAnchor="middle"
                        >
                            {formatTime(pct * maxMs)}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    );
}
