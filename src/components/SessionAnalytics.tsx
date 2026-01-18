'use client';

import React, { useState, useEffect } from 'react';
import VideoChartPlayer from './VideoChartPlayer';

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

interface SessionAnalyticsData {
    sessionId: string;
    startTime?: number;
    endTime?: number;
    durationMs?: number;
    eventCount: number;
    participants: string[];
    events: SliderEvent[];
    aggregates: AggregatePoint[];
}

interface Props {
    sessionId: string;
}

export default function SessionAnalytics({ sessionId }: Props) {
    const [data, setData] = useState<SessionAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>('');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/slider-data?sessionId=${sessionId}`);
                if (!res.ok) throw new Error('Failed to fetch analytics');
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [sessionId]);

    if (isLoading) return <div style={{ color: '#718096', padding: '20px' }}>Loading analytics...</div>;
    if (error) return <div style={{ color: '#e53e3e', padding: '20px' }}>Error: {error}</div>;
    if (!data || data.eventCount === 0) {
        return (
            <div style={{
                padding: '30px',
                textAlign: 'center',
                color: '#718096',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px'
            }}>
                No slider data recorded yet. Start a session to collect perception data.
            </div>
        );
    }

    // Format duration
    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Get participant data
    const participantEvents = selectedParticipant
        ? data.events.filter(e => e.participantId === selectedParticipant)
        : [];

    // Simple SVG chart
    const chartWidth = 600;
    const chartHeight = 200;
    const padding = 40;

    const maxMs = Math.max(...data.aggregates.map(a => a.sessionMs), 1);
    const xScale = (ms: number) => padding + (ms / maxMs) * (chartWidth - padding * 2);
    const yScale = (val: number) => chartHeight - padding - (val / 100) * (chartHeight - padding * 2);

    return (
        <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#9A3324', marginBottom: '12px', fontSize: '1rem', fontWeight: 600 }}>Session Analytics</h3>

            {/* Video Replay Section */}
            {videoUrl ? (
                <VideoChartPlayer
                    videoUrl={videoUrl}
                    events={data.events}
                    aggregates={data.aggregates}
                    durationMs={data.durationMs || 0}
                />
            ) : (
                <div style={{
                    background: '#F7FAFC',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #E2E8F0'
                }}>
                    <div style={{ color: '#4A5568', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>
                        📹 Session Replay (Optional)
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Paste S3 video URL to enable synced replay..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                fontSize: '13px'
                            }}
                        />
                        <button
                            onClick={() => {
                                // Try to construct URL from S3 bucket
                                const bucket = 'resonant-recordings';
                                const testUrl = `https://${bucket}.s3.amazonaws.com/resonant/${sessionId}/`;
                                window.open(testUrl, '_blank');
                            }}
                            style={{
                                padding: '8px 12px',
                                background: 'white',
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                color: '#4A5568'
                            }}
                        >
                            🔍 Browse S3
                        </button>
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px', marginTop: '8px' }}>
                        Recording stored at: s3://bucket/resonant/{sessionId}/
                    </div>
                </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ background: '#F7FAFC', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#718096', fontSize: '11px', textTransform: 'uppercase' }}>Duration</div>
                    <div style={{ color: '#1A1A2E', fontSize: '18px', fontWeight: 600 }}>
                        {data.durationMs ? formatDuration(data.durationMs) : 'N/A'}
                    </div>
                </div>
                <div style={{ background: '#F7FAFC', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#718096', fontSize: '11px', textTransform: 'uppercase' }}>Data Points</div>
                    <div style={{ color: '#9A3324', fontSize: '18px', fontWeight: 600 }}>
                        {data.eventCount.toLocaleString()}
                    </div>
                </div>
                <div style={{ background: '#F7FAFC', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#718096', fontSize: '11px', textTransform: 'uppercase' }}>Participants</div>
                    <div style={{ color: '#1A1A2E', fontSize: '18px', fontWeight: 600 }}>
                        {data.participants.length}
                    </div>
                </div>
            </div>

            {/* Aggregate chart */}
            <div style={{
                background: '#F7FAFC',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #E2E8F0'
            }}>
                <div style={{ color: '#4A5568', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>
                    Average Perception Over Time
                </div>
                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map(v => (
                        <g key={v}>
                            <line
                                x1={padding}
                                y1={yScale(v)}
                                x2={chartWidth - padding}
                                y2={yScale(v)}
                                stroke="#4a5568"
                                strokeDasharray="2,2"
                            />
                            <text x={padding - 8} y={yScale(v) + 4} fill="#718096" fontSize="10" textAnchor="end">
                                {v}
                            </text>
                        </g>
                    ))}

                    {/* Average line */}
                    {data.aggregates.length > 1 && (
                        <path
                            d={data.aggregates.map((a, i) =>
                                `${i === 0 ? 'M' : 'L'} ${xScale(a.sessionMs)} ${yScale(a.mean)}`
                            ).join(' ')}
                            fill="none"
                            stroke="#e53e3e"
                            strokeWidth="2"
                        />
                    )}

                    {/* Min/Max range */}
                    {data.aggregates.length > 1 && (
                        <path
                            d={[
                                ...data.aggregates.map((a, i) =>
                                    `${i === 0 ? 'M' : 'L'} ${xScale(a.sessionMs)} ${yScale(a.max)}`
                                ),
                                ...data.aggregates.slice().reverse().map((a, i) =>
                                    `L ${xScale(a.sessionMs)} ${yScale(a.min)}`
                                ),
                                'Z'
                            ].join(' ')}
                            fill="rgba(229, 62, 62, 0.1)"
                            stroke="none"
                        />
                    )}

                    {/* X-axis time labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                        const ms = pct * maxMs;
                        const secs = Math.round(ms / 1000);
                        return (
                            <text
                                key={pct}
                                x={xScale(ms)}
                                y={chartHeight - 10}
                                fill="#718096"
                                fontSize="10"
                                textAnchor="middle"
                            >
                                {secs}s
                            </text>
                        );
                    })}
                </svg>
            </div>

            {/* Participant selector */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#4A5568', fontSize: '12px', marginRight: '8px' }}>
                    View Individual:
                </label>
                <select
                    value={selectedParticipant || ''}
                    onChange={(e) => setSelectedParticipant(e.target.value || null)}
                    style={{
                        background: 'white',
                        color: '#1A1A2E',
                        border: '1px solid #E2E8F0',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontSize: '14px'
                    }}
                >
                    <option value="">-- Select Participant --</option>
                    {data.participants.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </div>

            {/* Individual participant data */}
            {selectedParticipant && participantEvents.length > 0 && (
                <div style={{
                    background: '#F7FAFC',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0'
                }}>
                    <div style={{ color: '#4A5568', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>
                        {selectedParticipant}&apos;s Perception ({participantEvents.length} data points)
                    </div>
                    <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map(v => (
                            <g key={v}>
                                <line
                                    x1={padding}
                                    y1={yScale(v)}
                                    x2={chartWidth - padding}
                                    y2={yScale(v)}
                                    stroke="#4a5568"
                                    strokeDasharray="2,2"
                                />
                                <text x={padding - 8} y={yScale(v) + 4} fill="#718096" fontSize="10" textAnchor="end">
                                    {v}
                                </text>
                            </g>
                        ))}

                        {/* Participant line */}
                        {participantEvents.length > 1 && (
                            <path
                                d={participantEvents.map((e, i) =>
                                    `${i === 0 ? 'M' : 'L'} ${xScale(e.sessionMs)} ${yScale(e.value)}`
                                ).join(' ')}
                                fill="none"
                                stroke="#4299e1"
                                strokeWidth="2"
                            />
                        )}
                    </svg>
                </div>
            )}

            {/* Export button */}
            <div style={{ marginTop: '16px' }}>
                <a
                    href={`/api/slider-data?sessionId=${sessionId}`}
                    target="_blank"
                    style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#9A3324',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500
                    }}
                >
                    📥 Export JSON Data
                </a>
            </div>
        </div>
    );
}
