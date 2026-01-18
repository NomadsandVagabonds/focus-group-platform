'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SliderEvent {
    participantId: string;
    value: number;
    timestamp: number;
    sessionMs: number;
}

interface Props {
    sessionId: string;
    participantCode: string;
    participantName?: string;
}

export default function ParticipantRatingData({ sessionId, participantCode, participantName }: Props) {
    const [events, setEvents] = useState<SliderEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [currentTimeMs, setCurrentTimeMs] = useState(0);
    const [durationMs, setDurationMs] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch slider data
                const res = await fetch(`/api/slider-data?sessionId=${sessionId}`);
                if (!res.ok) throw new Error('Failed to fetch slider data');
                const json = await res.json();

                // Filter events for this participant
                const participantEvents = (json.events || []).filter(
                    (e: SliderEvent) =>
                        e.participantId === participantCode ||
                        e.participantId.includes(participantCode) ||
                        e.participantId === participantName
                );

                setEvents(participantEvents);
                setDurationMs(json.durationMs || 0);

                // Fetch video URL
                try {
                    const recordingsRes = await fetch(`/api/recordings?sessionId=${sessionId}`);
                    if (recordingsRes.ok) {
                        const recordingsJson = await recordingsRes.json();
                        if (recordingsJson.latestUrl) {
                            setVideoUrl(recordingsJson.latestUrl);
                        }
                    }
                } catch {
                    // No recording - that's fine
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        }
        if (sessionId) fetchData();
    }, [sessionId, participantCode, participantName]);

    // Video time update
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTimeMs(video.currentTime * 1000);
        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [videoUrl]);

    if (isLoading) return <div style={{ color: '#718096', padding: '20px' }}>Loading rating data...</div>;
    if (error) return <div style={{ color: '#e53e3e', padding: '20px' }}>Error: {error}</div>;
    if (events.length === 0) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#718096' }}>
                No rating data recorded for this participant yet.
            </div>
        );
    }

    // Calculate stats
    const values = events.map(e => e.value);
    const avgValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Chart dimensions
    const chartWidth = 500;
    const chartHeight = 120;
    const padding = 35;

    const maxMs = durationMs || Math.max(...events.map(e => e.sessionMs), 1);
    const xScale = (ms: number) => padding + (ms / maxMs) * (chartWidth - padding * 2);
    const yScale = (val: number) => chartHeight - 25 - (val / 100) * (chartHeight - 50);

    // Get current value at playhead
    const getCurrentValue = () => {
        const point = events.find(e => e.sessionMs >= currentTimeMs) || events[events.length - 1];
        return point.value;
    };

    // Get animated path
    const getAnimatedPath = () => {
        const visiblePoints = events.filter(e => e.sessionMs <= currentTimeMs);
        if (visiblePoints.length < 2) return '';
        return visiblePoints.map((e, i) =>
            `${i === 0 ? 'M' : 'L'} ${xScale(e.sessionMs)} ${yScale(e.value)}`
        ).join(' ');
    };

    const getFullPath = () => {
        if (events.length < 2) return '';
        return events.map((e, i) =>
            `${i === 0 ? 'M' : 'L'} ${xScale(e.sessionMs)} ${yScale(e.value)}`
        ).join(' ');
    };

    // Seek on chart click
    const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const relativeX = (x - padding) / (chartWidth - padding * 2);
        video.currentTime = Math.max(0, Math.min(1, relativeX)) * (maxMs / 1000);
    };

    const formatTime = (ms: number) => {
        const secs = Math.floor(ms / 1000);
        const mins = Math.floor(secs / 60);
        return `${mins}:${(secs % 60).toString().padStart(2, '0')}`;
    };

    return (
        <div>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div style={{ background: '#F7FAFC', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '10px', textTransform: 'uppercase' }}>Data Points</div>
                    <div style={{ color: '#1A1A2E', fontSize: '14px', fontWeight: 600 }}>{events.length}</div>
                </div>
                <div style={{ background: '#F7FAFC', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '10px', textTransform: 'uppercase' }}>Avg</div>
                    <div style={{ color: '#9A3324', fontSize: '14px', fontWeight: 600 }}>{avgValue}</div>
                </div>
                <div style={{ background: '#F7FAFC', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '10px', textTransform: 'uppercase' }}>Range</div>
                    <div style={{ color: '#1A1A2E', fontSize: '14px', fontWeight: 600 }}>{minValue}-{maxValue}</div>
                </div>
            </div>

            {/* Video + Chart */}
            {videoUrl && (
                <div style={{ marginBottom: '12px' }}>
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        style={{ width: '100%', maxHeight: '250px', borderRadius: '8px 8px 0 0', display: 'block' }}
                    />
                    <div style={{
                        background: '#F7FAFC',
                        padding: '8px 12px',
                        borderRadius: '0 0 8px 8px',
                        border: '1px solid #E2E8F0',
                        borderTop: 'none'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#718096', fontSize: '11px' }}>
                                {formatTime(currentTimeMs)} / {formatTime(maxMs)}
                            </span>
                            <span style={{
                                color: getCurrentValue() < 35 ? '#e53e3e' : getCurrentValue() > 65 ? '#38a169' : '#718096',
                                fontSize: '12px',
                                fontWeight: 600
                            }}>
                                Current: {getCurrentValue()}
                            </span>
                        </div>
                        <svg
                            width="100%"
                            height={chartHeight}
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            style={{ cursor: 'pointer' }}
                            onClick={handleChartClick}
                        >
                            {/* Grid */}
                            {[0, 50, 100].map(v => (
                                <line key={v} x1={padding} y1={yScale(v)} x2={chartWidth - padding} y2={yScale(v)} stroke="#E2E8F0" strokeDasharray="2,2" />
                            ))}
                            {/* Full path */}
                            <path d={getFullPath()} fill="none" stroke="#E2E8F0" strokeWidth="2" />
                            {/* Animated path */}
                            <path d={getAnimatedPath()} fill="none" stroke="#9A3324" strokeWidth="2.5" />
                            {/* Playhead */}
                            <line x1={xScale(currentTimeMs)} y1={yScale(100)} x2={xScale(currentTimeMs)} y2={yScale(0)} stroke="#9A3324" strokeWidth="2" opacity="0.8" />
                            <circle cx={xScale(currentTimeMs)} cy={yScale(getCurrentValue())} r="5" fill="#9A3324" stroke="white" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Static chart if no video */}
            {!videoUrl && (
                <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '8px' }}>
                    <svg width="100%" height={chartHeight + 20} viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}>
                        {[0, 25, 50, 75, 100].map(v => (
                            <g key={v}>
                                <line x1={padding} y1={yScale(v)} x2={chartWidth - padding} y2={yScale(v)} stroke="#E2E8F0" strokeDasharray="2,2" />
                                <text x={padding - 6} y={yScale(v) + 3} fill="#718096" fontSize="9" textAnchor="end">{v}</text>
                            </g>
                        ))}
                        <path d={getFullPath()} fill="none" stroke="#9A3324" strokeWidth="2" />
                        {[0, 0.5, 1].map(pct => (
                            <text key={pct} x={xScale(pct * maxMs)} y={chartHeight + 10} fill="#718096" fontSize="9" textAnchor="middle">
                                {formatTime(pct * maxMs)}
                            </text>
                        ))}
                    </svg>
                </div>
            )}
        </div>
    );
}
