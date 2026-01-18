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

            {/* Synced Chart - Modern Dark Theme */}
            <div style={{
                background: '#1A1A2E',
                padding: '16px 20px',
                borderRadius: '0 0 12px 12px',
            }}>
                {/* Current stats */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'monospace' }}>
                            {formatTime(currentTimeMs)} / {formatTime(durationMs)}
                        </span>
                        <span style={{
                            color: getCurrentValue() < 35 ? '#ef4444' : getCurrentValue() > 65 ? '#22c55e' : '#facc15',
                            fontWeight: 700,
                            fontSize: '16px',
                            textShadow: getCurrentValue() > 65 ? '0 0 10px rgba(34,197,94,0.5)' : getCurrentValue() < 35 ? '0 0 10px rgba(239,68,68,0.5)' : 'none'
                        }}>
                            Current Avg: {getCurrentValue()}
                        </span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                        Click chart to seek
                    </span>
                </div>

                {/* Interactive Chart */}
                <svg
                    width="100%"
                    height={chartHeight + 20}
                    viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
                    style={{ cursor: 'pointer' }}
                    onClick={handleChartClick}
                >
                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
                        </linearGradient>
                        <linearGradient id="revealedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                            <stop offset="50%" stopColor="#1A1A2E" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Subtle grid lines */}
                    {[0, 25, 50, 75, 100].map(v => (
                        <g key={v}>
                            <line
                                x1={padding}
                                y1={yScale(v)}
                                x2={chartWidth - padding}
                                y2={yScale(v)}
                                stroke="rgba(255,255,255,0.1)"
                                strokeDasharray={v === 50 ? "0" : "4,4"}
                                strokeWidth={v === 50 ? 1 : 0.5}
                            />
                            <text x={padding - 8} y={yScale(v) + 3} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">
                                {v}
                            </text>
                        </g>
                    ))}

                    {/* Full path (faded future) */}
                    <path
                        d={getFullPath()}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Gradient fill under revealed curve */}
                    {aggregates.filter(a => a.sessionMs <= currentTimeMs).length >= 2 && (
                        <path
                            d={getAnimatedPath() + ` L ${xScale(currentTimeMs)} ${yScale(0)} L ${padding} ${yScale(0)} Z`}
                            fill="url(#revealedGradient)"
                            opacity="0.4"
                        />
                    )}

                    {/* Animated path (revealed) - with glow */}
                    <path
                        d={getAnimatedPath()}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />

                    {/* Playhead line */}
                    <line
                        x1={xScale(currentTimeMs)}
                        y1={yScale(100)}
                        x2={xScale(currentTimeMs)}
                        y2={yScale(0)}
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth="1"
                        strokeDasharray="4,2"
                    />

                    {/* Playhead dot with glow */}
                    <circle
                        cx={xScale(currentTimeMs)}
                        cy={yScale(getCurrentValue())}
                        r="8"
                        fill={getCurrentValue() < 35 ? '#ef4444' : getCurrentValue() > 65 ? '#22c55e' : '#facc15'}
                        filter="url(#glow)"
                    />
                    <circle
                        cx={xScale(currentTimeMs)}
                        cy={yScale(getCurrentValue())}
                        r="4"
                        fill="white"
                    />

                    {/* Time labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                        <text
                            key={pct}
                            x={xScale(pct * maxMs)}
                            y={chartHeight + 12}
                            fill="rgba(255,255,255,0.4)"
                            fontSize="10"
                            textAnchor="middle"
                            fontFamily="monospace"
                        >
                            {formatTime(pct * maxMs)}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    );
}
