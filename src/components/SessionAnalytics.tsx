'use client';

import React, { useState, useEffect } from 'react';

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
            <h3 style={{ color: '#e2e8f0', marginBottom: '12px' }}>Session Analytics</h3>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '12px' }}>Duration</div>
                    <div style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 600 }}>
                        {data.durationMs ? formatDuration(data.durationMs) : 'N/A'}
                    </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '12px' }}>Data Points</div>
                    <div style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 600 }}>
                        {data.eventCount.toLocaleString()}
                    </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '12px' }}>Participants</div>
                    <div style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 600 }}>
                        {data.participants.length}
                    </div>
                </div>
            </div>

            {/* Aggregate chart */}
            <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <div style={{ color: '#a0aec0', fontSize: '12px', marginBottom: '8px' }}>
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
                <label style={{ color: '#a0aec0', fontSize: '12px', marginRight: '8px' }}>
                    View Individual:
                </label>
                <select
                    value={selectedParticipant || ''}
                    onChange={(e) => setSelectedParticipant(e.target.value || null)}
                    style={{
                        background: '#2d3748',
                        color: '#e2e8f0',
                        border: '1px solid #4a5568',
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
                    background: 'rgba(0,0,0,0.3)',
                    padding: '16px',
                    borderRadius: '8px'
                }}>
                    <div style={{ color: '#a0aec0', fontSize: '12px', marginBottom: '8px' }}>
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
                        background: '#4a5568',
                        color: '#e2e8f0',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '14px'
                    }}
                >
                    📥 Export JSON Data
                </a>
            </div>
        </div>
    );
}
