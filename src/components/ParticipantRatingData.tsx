'use client';

import React, { useState, useEffect } from 'react';

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

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/slider-data?sessionId=${sessionId}`);
                if (!res.ok) throw new Error('Failed to fetch slider data');
                const json = await res.json();

                // Filter events for this participant (by code or display name)
                const participantEvents = (json.events || []).filter(
                    (e: SliderEvent) =>
                        e.participantId === participantCode ||
                        e.participantId.includes(participantCode) ||
                        e.participantId === participantName
                );

                setEvents(participantEvents);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        }
        if (sessionId) fetchData();
    }, [sessionId, participantCode, participantName]);

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
    const durationMs = events[events.length - 1].sessionMs - events[0].sessionMs;
    const durationSecs = Math.round(durationMs / 1000);

    // Chart dimensions
    const chartWidth = 500;
    const chartHeight = 150;
    const padding = 35;

    const maxMs = Math.max(...events.map(e => e.sessionMs), 1);
    const xScale = (ms: number) => padding + (ms / maxMs) * (chartWidth - padding * 2);
    const yScale = (val: number) => chartHeight - padding - (val / 100) * (chartHeight - padding * 2);

    return (
        <div>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ background: '#F7FAFC', padding: '10px 14px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '11px', textTransform: 'uppercase' }}>Data Points</div>
                    <div style={{ color: '#1A1A2E', fontSize: '16px', fontWeight: 600 }}>{events.length}</div>
                </div>
                <div style={{ background: '#F7FAFC', padding: '10px 14px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '11px', textTransform: 'uppercase' }}>Avg Rating</div>
                    <div style={{ color: '#9A3324', fontSize: '16px', fontWeight: 600 }}>{avgValue}</div>
                </div>
                <div style={{ background: '#F7FAFC', padding: '10px 14px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '11px', textTransform: 'uppercase' }}>Range</div>
                    <div style={{ color: '#1A1A2E', fontSize: '16px', fontWeight: 600 }}>{minValue} - {maxValue}</div>
                </div>
                <div style={{ background: '#F7FAFC', padding: '10px 14px', borderRadius: '6px' }}>
                    <div style={{ color: '#718096', fontSize: '11px', textTransform: 'uppercase' }}>Duration</div>
                    <div style={{ color: '#1A1A2E', fontSize: '16px', fontWeight: 600 }}>{durationSecs}s</div>
                </div>
            </div>

            {/* Chart */}
            <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '8px' }}>
                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
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

                    {/* Data line */}
                    {events.length > 1 && (
                        <path
                            d={events.map((e, i) =>
                                `${i === 0 ? 'M' : 'L'} ${xScale(e.sessionMs)} ${yScale(e.value)}`
                            ).join(' ')}
                            fill="none"
                            stroke="#9A3324"
                            strokeWidth="2"
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
                                y={chartHeight - 8}
                                fill="#718096"
                                fontSize="9"
                                textAnchor="middle"
                            >
                                {secs}s
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
