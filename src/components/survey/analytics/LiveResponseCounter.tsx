'use client';

import { useState, useEffect, useCallback } from 'react';

interface ResponseCounts {
    total: number;
    complete: number;
    incomplete: number;
    screened_out: number;
}

interface LiveResponseCounterProps {
    surveyId: string;
    initialCounts?: ResponseCounts;
    pollInterval?: number; // ms, default 30000 (30 seconds)
    showBreakdown?: boolean;
    compact?: boolean;
    onCountChange?: (counts: ResponseCounts) => void;
}

export default function LiveResponseCounter({
    surveyId,
    initialCounts,
    pollInterval = 30000,
    showBreakdown = false,
    compact = false,
    onCountChange
}: LiveResponseCounterProps) {
    const [counts, setCounts] = useState<ResponseCounts>(initialCounts || {
        total: 0,
        complete: 0,
        incomplete: 0,
        screened_out: 0
    });
    const [loading, setLoading] = useState(!initialCounts);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isLive, setIsLive] = useState(true);
    const [hasNewResponse, setHasNewResponse] = useState(false);

    const fetchCounts = useCallback(async () => {
        try {
            const response = await fetch(`/api/survey/responses/${surveyId}/count`);
            if (!response.ok) throw new Error('Failed to fetch counts');

            const data = await response.json();
            const newCounts: ResponseCounts = {
                total: data.total || 0,
                complete: data.complete || 0,
                incomplete: data.incomplete || 0,
                screened_out: data.screened_out || 0
            };

            // Check if counts changed (new response came in)
            if (counts.total > 0 && newCounts.total > counts.total) {
                setHasNewResponse(true);
                setTimeout(() => setHasNewResponse(false), 2000);
            }

            setCounts(newCounts);
            setLastUpdated(new Date());
            setLoading(false);

            if (onCountChange) {
                onCountChange(newCounts);
            }
        } catch (error) {
            console.error('Error fetching response counts:', error);
            setLoading(false);
        }
    }, [surveyId, counts.total, onCountChange]);

    // Initial fetch
    useEffect(() => {
        fetchCounts();
    }, [surveyId]); // Only on surveyId change, not fetchCounts

    // Polling
    useEffect(() => {
        if (!isLive || pollInterval <= 0) return;

        const interval = setInterval(fetchCounts, pollInterval);
        return () => clearInterval(interval);
    }, [isLive, pollInterval, fetchCounts]);

    // Pause/resume on visibility change (save resources when tab not visible)
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsLive(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    if (compact) {
        return (
            <div className={`response-counter-compact ${hasNewResponse ? 'pulse' : ''}`}>
                <span className="count">{counts.total}</span>
                <span className="label">responses</span>
                {isLive && (
                    <span className="live-indicator" title="Live updating">
                        <span className="dot" />
                    </span>
                )}

                <style jsx>{`
                    .response-counter-compact {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.375rem;
                        font-size: 0.875rem;
                        color: #666;
                        transition: all 0.3s ease;
                    }

                    .response-counter-compact.pulse {
                        animation: pulse 0.5s ease-in-out;
                    }

                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }

                    .count {
                        font-weight: 600;
                        color: #1a1d24;
                        font-size: 1rem;
                    }

                    .label {
                        color: #888;
                    }

                    .live-indicator {
                        display: inline-flex;
                        align-items: center;
                        margin-left: 0.25rem;
                    }

                    .dot {
                        width: 6px;
                        height: 6px;
                        background: #22c55e;
                        border-radius: 50%;
                        animation: blink 2s ease-in-out infinite;
                    }

                    @keyframes blink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.3; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className={`response-counter ${hasNewResponse ? 'new-response' : ''}`}>
            <div className="counter-header">
                <div className="main-count">
                    <span className="number">{loading ? '—' : counts.total}</span>
                    <span className="label">Total Responses</span>
                </div>
                {isLive && (
                    <div className="live-badge">
                        <span className="dot" />
                        Live
                    </div>
                )}
            </div>

            {showBreakdown && !loading && (
                <div className="breakdown">
                    <div className="breakdown-item complete">
                        <span className="value">{counts.complete}</span>
                        <span className="label">Complete</span>
                    </div>
                    <div className="breakdown-item incomplete">
                        <span className="value">{counts.incomplete}</span>
                        <span className="label">In Progress</span>
                    </div>
                    {counts.screened_out > 0 && (
                        <div className="breakdown-item screened">
                            <span className="value">{counts.screened_out}</span>
                            <span className="label">Screened Out</span>
                        </div>
                    )}
                </div>
            )}

            {lastUpdated && (
                <div className="last-updated">
                    Updated {formatTimeAgo(lastUpdated)}
                </div>
            )}

            <style jsx>{`
                .response-counter {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    border: 1px solid #e0ddd8;
                    transition: all 0.3s ease;
                }

                .response-counter.new-response {
                    border-color: #22c55e;
                    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
                    animation: highlight 0.5s ease-out;
                }

                @keyframes highlight {
                    0% { background: #f0fdf4; }
                    100% { background: white; }
                }

                .counter-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .main-count {
                    display: flex;
                    flex-direction: column;
                }

                .main-count .number {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1a1d24;
                    line-height: 1;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .main-count .label {
                    font-size: 0.8rem;
                    color: #888;
                    margin-top: 0.25rem;
                }

                .live-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    background: #f0fdf4;
                    color: #15803d;
                    padding: 0.25rem 0.625rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .live-badge .dot {
                    width: 6px;
                    height: 6px;
                    background: #22c55e;
                    border-radius: 50%;
                    animation: blink 2s ease-in-out infinite;
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .breakdown {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #f0ede8;
                }

                .breakdown-item {
                    flex: 1;
                    text-align: center;
                }

                .breakdown-item .value {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 600;
                    line-height: 1;
                }

                .breakdown-item .label {
                    display: block;
                    font-size: 0.7rem;
                    color: #888;
                    margin-top: 0.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .breakdown-item.complete .value {
                    color: #15803d;
                }

                .breakdown-item.incomplete .value {
                    color: #d97706;
                }

                .breakdown-item.screened .value {
                    color: #dc2626;
                }

                .last-updated {
                    font-size: 0.7rem;
                    color: #aaa;
                    margin-top: 0.75rem;
                    text-align: right;
                }
            `}</style>
        </div>
    );
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString();
}
