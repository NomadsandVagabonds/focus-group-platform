'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Props {
    initialMinutes?: number;
}

export default function CountdownTimer({ initialMinutes = 60 }: Props) {
    const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [initialTime] = useState(initialMinutes * 60);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning && totalSeconds > 0) {
            interval = setInterval(() => {
                setTotalSeconds(prev => Math.max(0, prev - 1));
            }, 1000);
        } else if (totalSeconds === 0) {
            setIsRunning(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, totalSeconds]);

    const toggle = useCallback(() => {
        setIsRunning(prev => !prev);
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setTotalSeconds(initialTime);
    }, [initialTime]);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Color based on time remaining
    const getColor = () => {
        if (totalSeconds <= 60) return '#e53e3e'; // Red - final minute
        if (totalSeconds <= 300) return '#ed8936'; // Orange - final 5 min
        return '#e2e8f0'; // Default
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
        }}>
            {/* Timer display */}
            <div style={{
                fontFamily: 'monospace',
                fontSize: '28px',
                fontWeight: 700,
                color: getColor(),
                letterSpacing: '2px',
                textShadow: totalSeconds <= 60 ? '0 0 8px rgba(229,62,62,0.5)' : 'none'
            }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '6px' }}>
                <button
                    onClick={toggle}
                    style={{
                        padding: '4px 12px',
                        background: isRunning ? '#e53e3e' : '#38a169',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600
                    }}
                >
                    {isRunning ? 'STOP' : 'START'}
                </button>
                <button
                    onClick={reset}
                    style={{
                        padding: '4px 12px',
                        background: '#4a5568',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600
                    }}
                >
                    RESET
                </button>
            </div>
        </div>
    );
}
