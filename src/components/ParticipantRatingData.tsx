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
                const res = await fetch(`/api/slider-data?sessionId=${sessionId}`);
                if (!res.ok) throw new Error('Failed to fetch slider data');
                const json = await res.json();

                const participantEvents = (json.events || []).filter(
                    (e: SliderEvent) =>
                        e.participantId === participantCode ||
                        e.participantId.includes(participantCode) ||
                        e.participantId === participantName
                );

                setEvents(participantEvents);
                setDurationMs(json.durationMs || 0);

                try {
                    const recordingsRes = await fetch(`/api/recordings?sessionId=${sessionId}`);
                    if (recordingsRes.ok) {
                        const recordingsJson = await recordingsRes.json();
                        if (recordingsJson.latestUrl) setVideoUrl(recordingsJson.latestUrl);
                    }
                } catch { /* no recording */ }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        }
        if (sessionId) fetchData();
    }, [sessionId, participantCode, participantName]);

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

    // Stats
    const values = events.map(e => e.value);
    const avgValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Chart
    const chartWidth = 600;
    const chartHeight = 100;
    const padding = 40;
    const maxMs = durationMs || Math.max(...events.map(e => e.sessionMs), 1);
    const xScale = (ms: number) => padding + (ms / maxMs) * (chartWidth - padding * 2);
    const yScale = (val: number) => chartHeight - 20 - (val / 100) * (chartHeight - 35);

    const getCurrentValue = () => {
        const point = events.find(e => e.sessionMs >= currentTimeMs) || events[events.length - 1];
        return point.value;
    };

    const getAnimatedPath = () => {
        const visible = events.filter(e => e.sessionMs <= currentTimeMs);
        if (visible.length < 2) return '';
        return visible.map((e, i) => `${i === 0 ? 'M' : 'L'} ${xScale(e.sessionMs)} ${yScale(e.value)}`).join(' ');
    };

    const getFullPath = () => {
        if (events.length < 2) return '';
        return events.map((e, i) => `${i === 0 ? 'M' : 'L'} ${xScale(e.sessionMs)} ${yScale(e.value)}`).join(' ');
    };

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
        return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
    };

    const avgColor = avgValue < 35 ? '#e53e3e' : avgValue > 65 ? '#38a169' : '#718096';

    return (
        <div>
            {/* Video with integrated chart */}
            {videoUrl ? (
                <div style={{
                    background: '#1A1A2E',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '16px'
                }}>
                    {/* Video */}
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        style={{ width: '100%', display: 'block', maxHeight: '280px' }}
                    />

                    {/* Chart overlay bar */}
                    <div style={{
                        background: 'linear-gradient(180deg, rgba(26,26,46,0.95) 0%, rgba(26,26,46,1) 100%)',
                        padding: '12px 16px'
                    }}>
                        {/* Time and current value */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                        }}>
                            <span style={{ color: '#a0aec0', fontSize: '12px' }}>
                                {formatTime(currentTimeMs)} / {formatTime(maxMs)}
                            </span>
                            <span style={{
                                color: getCurrentValue() < 35 ? '#fc8181' : getCurrentValue() > 65 ? '#68d391' : '#a0aec0',
                                fontSize: '13px',
                                fontWeight: 600
                            }}>
                                Current: {getCurrentValue()}
                            </span>
                        </div>

                        {/* Synced chart */}
                        <svg
                            width="100%"
                            height={chartHeight}
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            style={{ cursor: 'pointer', display: 'block' }}
                            onClick={handleChartClick}
                        >
                            {/* Grid */}
                            {[0, 50, 100].map(v => (
                                <g key={v}>
                                    <line x1={padding} y1={yScale(v)} x2={chartWidth - padding} y2={yScale(v)} stroke="#4a5568" strokeDasharray="2,2" />
                                    <text x={padding - 6} y={yScale(v) + 4} fill="#718096" fontSize="9" textAnchor="end">{v}</text>
                                </g>
                            ))}
                            {/* Full path (faded) */}
                            <path d={getFullPath()} fill="none" stroke="#4a5568" strokeWidth="1.5" />
                            {/* Animated path */}
                            <path d={getAnimatedPath()} fill="none" stroke="#9A3324" strokeWidth="2.5" />
                            {/* Playhead */}
                            <line x1={xScale(currentTimeMs)} y1={yScale(100)} x2={xScale(currentTimeMs)} y2={yScale(0)} stroke="#9A3324" strokeWidth="2" />
                            <circle cx={xScale(currentTimeMs)} cy={yScale(getCurrentValue())} r="5" fill="#9A3324" stroke="#1A1A2E" strokeWidth="2" />
                            {/* Time labels */}
                            {[0, 0.5, 1].map(pct => (
                                <text key={pct} x={xScale(pct * maxMs)} y={chartHeight - 3} fill="#718096" fontSize="9" textAnchor="middle">
                                    {formatTime(pct * maxMs)}
                                </text>
                            ))}
                        </svg>
                    </div>
                </div>
            ) : (
                /* Static chart when no video */
                <div style={{ background: '#F7FAFC', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <svg width="100%" height={chartHeight + 15} viewBox={`0 0 ${chartWidth} ${chartHeight + 15}`}>
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

            {/* Stats row - below video */}
            <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '12px 0'
            }}>
                <div style={{ background: '#F7FAFC', padding: '10px 16px', borderRadius: '6px', border: '1px solid #E2E8F0', flex: '1', minWidth: '80px' }}>
                    <div style={{ color: '#718096', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Data Points</div>
                    <div style={{ color: '#1A1A2E', fontSize: '18px', fontWeight: 600 }}>{events.length}</div>
                </div>
                <div style={{ background: '#F7FAFC', padding: '10px 16px', borderRadius: '6px', border: '1px solid #E2E8F0', flex: '1', minWidth: '80px' }}>
                    <div style={{ color: '#718096', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Avg Rating</div>
                    <div style={{ color: avgColor, fontSize: '18px', fontWeight: 600 }}>{avgValue}</div>
                </div>
                <div style={{ background: '#F7FAFC', padding: '10px 16px', borderRadius: '6px', border: '1px solid #E2E8F0', flex: '1', minWidth: '80px' }}>
                    <div style={{ color: '#718096', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Range</div>
                    <div style={{ color: '#1A1A2E', fontSize: '18px', fontWeight: 600 }}>{minValue} – {maxValue}</div>
                </div>
            </div>
        </div>
    );
}
