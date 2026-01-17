'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './PerceptionDial.module.css';

interface PerceptionDialProps {
    /** Callback fired at granular intervals with current value */
    onValueChange?: (value: number, timestamp: number) => void;
    /** Tracking interval in milliseconds (default: 250ms) */
    intervalMs?: number;
    /** Initial value (0-100) */
    initialValue?: number;
    /** Whether the dial is actively tracking */
    isActive?: boolean;
    /** Show numeric value display */
    showValue?: boolean;
    /** Enable haptic feedback on mobile */
    enableHaptics?: boolean;
}

const LABELS = [
    { value: 0, label: 'Strongly Disagree', short: 'SD' },
    { value: 25, label: 'Disagree', short: 'D' },
    { value: 50, label: 'Neutral', short: 'N' },
    { value: 75, label: 'Agree', short: 'A' },
    { value: 100, label: 'Strongly Agree', short: 'SA' },
];

export default function PerceptionDial({
    onValueChange,
    intervalMs = 250,
    initialValue = 50,
    isActive = true,
    showValue = true,
    enableHaptics = true,
}: PerceptionDialProps) {
    const [value, setValue] = useState(initialValue);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const lastHapticValue = useRef<number>(Math.round(value / 25) * 25);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate color based on value
    const getDialColor = (val: number): string => {
        if (val < 35) return 'var(--color-dial-negative)';
        if (val > 65) return 'var(--color-dial-positive)';
        return 'var(--color-dial-neutral)';
    };

    // Haptic feedback for significant value changes
    const triggerHaptic = useCallback((newValue: number) => {
        if (!enableHaptics || typeof navigator === 'undefined') return;

        const roundedValue = Math.round(newValue / 25) * 25;
        if (roundedValue !== lastHapticValue.current) {
            lastHapticValue.current = roundedValue;
            if ('vibrate' in navigator) {
                navigator.vibrate(15);
            }
        }
    }, [enableHaptics]);

    // Convert pointer position to value
    const getValueFromPosition = useCallback((clientY: number): number => {
        if (!sliderRef.current) return value;

        const rect = sliderRef.current.getBoundingClientRect();
        const relativeY = clientY - rect.top;
        const percentage = 1 - (relativeY / rect.height);
        return Math.max(0, Math.min(100, Math.round(percentage * 100)));
    }, [value]);

    // Handle pointer events
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const newValue = getValueFromPosition(e.clientY);
        setValue(newValue);
        triggerHaptic(newValue);

        // Capture pointer for smoother tracking
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [getValueFromPosition, triggerHaptic]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        const newValue = getValueFromPosition(e.clientY);
        setValue(newValue);
        triggerHaptic(newValue);
    }, [isDragging, getValueFromPosition, triggerHaptic]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    // Interval-based value reporting
    useEffect(() => {
        if (!isActive || !onValueChange) return;

        intervalRef.current = setInterval(() => {
            onValueChange(value, Date.now());
        }, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, value, onValueChange, intervalMs]);

    // Get current label
    const currentLabel = LABELS.reduce((prev, curr) =>
        Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
    );

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Your Response</h3>

            {showValue && (
                <div
                    className={styles.valueDisplay}
                    style={{ backgroundColor: getDialColor(value) }}
                >
                    <span className={styles.valueNumber}>{value}</span>
                    <span className={styles.valueLabel}>{currentLabel.label}</span>
                </div>
            )}

            <div className={styles.dialWrapper}>
                {/* Labels */}
                <div className={styles.labelTrack}>
                    {LABELS.slice().reverse().map((l) => (
                        <span
                            key={l.value}
                            className={`${styles.label} ${Math.abs(value - l.value) < 12.5 ? styles.labelActive : ''}`}
                        >
                            {l.short}
                        </span>
                    ))}
                </div>

                {/* Slider Track */}
                <div
                    ref={sliderRef}
                    className={`${styles.sliderTrack} ${isDragging ? styles.dragging : ''}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ touchAction: 'none' }}
                >
                    {/* Fill */}
                    <div
                        className={styles.sliderFill}
                        style={{
                            height: `${value}%`,
                            background: `linear-gradient(to top, ${getDialColor(value)}, ${getDialColor(value)}88)`
                        }}
                    />

                    {/* Thumb */}
                    <div
                        className={styles.sliderThumb}
                        style={{
                            bottom: `${value}%`,
                            backgroundColor: getDialColor(value),
                            boxShadow: isDragging ? `0 0 20px ${getDialColor(value)}` : undefined
                        }}
                    >
                        <span className={styles.thumbValue}>{value}</span>
                    </div>

                    {/* Tick marks */}
                    <div className={styles.tickMarks}>
                        {[0, 25, 50, 75, 100].map((tick) => (
                            <div
                                key={tick}
                                className={styles.tick}
                                style={{ bottom: `${tick}%` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className={styles.instructions}>
                    <span>Drag or tap to respond</span>
                    <span className={styles.trackingIndicator}>
                        {isActive ? '● Tracking' : '○ Paused'}
                    </span>
                </div>
            </div>
        </div>
    );
}
