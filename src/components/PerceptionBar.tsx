'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './PerceptionBar.module.css';

interface PerceptionBarProps {
    /** Callback fired at granular intervals with current value */
    onValueChange?: (value: number, timestamp: number, lastInteractionTime: number) => void;
    /** Tracking interval in milliseconds (default: 250ms) */
    intervalMs?: number;
    /** Initial value (0-100) */
    initialValue?: number;
    /** Whether the dial is actively tracking */
    isActive?: boolean;
    /** Enable haptic feedback on mobile */
    enableHaptics?: boolean;
    /** Show the "Please keep rating!" prompt */
    showPrompt?: boolean;
}

const EMOJI_PRESETS = [
    { value: 12, emoji: '👎👎', label: 'Strongly Disagree', color: '#ef4444' },
    { value: 37, emoji: '👎', label: 'Disagree', color: '#f97316' },
    { value: 62, emoji: '👍', label: 'Agree', color: '#22c55e' },
    { value: 87, emoji: '👍👍', label: 'Strongly Agree', color: '#10b981' },
];

export default function PerceptionBar({
    onValueChange,
    intervalMs = 250,
    initialValue = 50,
    isActive = true,
    enableHaptics = true,
    showPrompt = true,
}: PerceptionBarProps) {
    const [value, setValue] = useState(initialValue);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const lastHapticValue = useRef<number>(Math.round(value / 25) * 25);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Use ref for value to avoid recreating interval on every change
    const valueRef = useRef(value);
    const onValueChangeRef = useRef(onValueChange);
    const lastInteractionTimeRef = useRef(Date.now()); // Track when user last moved slider

    // Load saved value on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('fg_perception_value');
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed !== value) {
                    setValue(parsed);
                    // Also notify parent immediately so data stream is consistent
                    if (onValueChange) {
                        onValueChange(parsed, Date.now());
                    }
                }
            }
        }
    }, [onValueChange]); // Only run once on mount (deps are stable)

    // Keep refs updated
    useEffect(() => {
        valueRef.current = value;
        // Persist to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('fg_perception_value', value.toString());
        }
    }, [value]);

    useEffect(() => {
        onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

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

    // Convert pointer position to value (horizontal)
    const getValueFromPosition = useCallback((clientX: number): number => {
        if (!sliderRef.current) return value;

        const rect = sliderRef.current.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const percentage = relativeX / rect.width;
        return Math.max(0, Math.min(100, Math.round(percentage * 100)));
    }, [value]);

    // Handle pointer events
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const newValue = getValueFromPosition(e.clientX);
        setValue(newValue);
        triggerHaptic(newValue);
        lastInteractionTimeRef.current = Date.now();

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [getValueFromPosition, triggerHaptic]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        const newValue = getValueFromPosition(e.clientX);
        setValue(newValue);
        triggerHaptic(newValue);
        lastInteractionTimeRef.current = Date.now();
    }, [isDragging, getValueFromPosition, triggerHaptic]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    // Handle emoji button clicks
    const handleEmojiClick = useCallback((presetValue: number) => {
        setValue(presetValue);
        triggerHaptic(presetValue);
        lastInteractionTimeRef.current = Date.now();
    }, [triggerHaptic]);

    // Handle keyboard arrow controls
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        let newValue = valueRef.current;
        const step = e.shiftKey ? 10 : 5; // Bigger step with Shift held

        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
            case 'a':
            case 'A':
                e.preventDefault();
                newValue = Math.max(0, valueRef.current - step);
                break;
            case 'ArrowRight':
            case 'ArrowUp':
            case 'd':
            case 'D':
                e.preventDefault();
                newValue = Math.min(100, valueRef.current + step);
                break;
            default:
                return;
        }

        setValue(newValue);
        triggerHaptic(newValue);
        lastInteractionTimeRef.current = Date.now();
    }, [triggerHaptic]);

    // Keyboard listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Stable interval-based value reporting using refs
    useEffect(() => {
        if (!isActive) return;

        console.log('[PerceptionBar] Starting stable interval');

        intervalRef.current = setInterval(() => {
            if (onValueChangeRef.current) {
                console.log('[PerceptionBar] Reporting value:', valueRef.current);
                onValueChangeRef.current(valueRef.current, Date.now(), lastInteractionTimeRef.current);
            }
        }, intervalMs);

        return () => {
            console.log('[PerceptionBar] Clearing interval');
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, intervalMs]); // Only recreate when isActive or intervalMs changes

    // Get color based on current value
    const getValueColor = (val: number): string => {
        if (val < 25) return '#ef4444';
        if (val < 50) return '#f97316';
        if (val < 75) return '#22c55e';
        return '#10b981';
    };

    return (
        <div className={styles.container}>
            {/* Rating prompt */}
            {showPrompt && (
                <div className={styles.prompt}>
                    <span>Please Keep Rating Continuously</span>
                </div>
            )}

            {/* Horizontal slider */}
            <div className={styles.sliderContainer}>
                <div
                    ref={sliderRef}
                    className={`${styles.sliderTrack} ${isDragging ? styles.dragging : ''}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ touchAction: 'none' }}
                >
                    {/* Gradient background */}
                    <div className={styles.gradientBg} />

                    {/* Tick marks */}
                    <div className={styles.tickMarks}>
                        {[0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100].map((tick) => (
                            <div
                                key={tick}
                                className={`${styles.tick} ${tick % 25 === 0 ? styles.majorTick : ''}`}
                                style={{ left: `${tick}%` }}
                            />
                        ))}
                    </div>

                    {/* Thumb */}
                    <div
                        className={styles.thumb}
                        style={{
                            left: `${value}%`,
                            backgroundColor: '#ffffff',
                            boxShadow: isDragging ? `0 0 12px ${getValueColor(value)}` : undefined
                        }}
                    />
                </div>
            </div>

            {/* Emoji buttons */}
            <div className={styles.emojiButtons}>
                {EMOJI_PRESETS.map((preset) => (
                    <button
                        key={preset.value}
                        className={`${styles.emojiBtn} ${Math.abs(value - preset.value) < 15 ? styles.active : ''}`}
                        onClick={() => handleEmojiClick(preset.value)}
                        style={{ color: preset.color }}
                        title={preset.label}
                    >
                        <span className={styles.emoji}>{preset.emoji}</span>
                    </button>
                ))}
            </div>

            {/* Tracking indicator (subtle) */}
            <div className={styles.trackingStatus}>
                <span
                    className={styles.statusDot}
                    style={{ backgroundColor: isActive ? '#22c55e' : '#6b7280' }}
                />
                {isActive ? 'Tracking' : 'Paused'}
            </div>
        </div>
    );
}
