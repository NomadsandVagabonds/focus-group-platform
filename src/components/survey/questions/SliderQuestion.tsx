// Slider Control Question Component
// Visual slider variant of Numerical Input (LimeSurvey question theme variant)
'use client';

import { useCallback, useMemo, useId } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface SliderQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function SliderQuestion({ question, responseData, onAnswer }: SliderQuestionProps) {
    const sliderId = useId();
    const settings = question.settings || {};

    // Extract slider settings with defaults
    const min = settings.slider_min ?? 0;
    const max = settings.slider_max ?? 100;
    const step = settings.slider_step ?? 1;
    const showValue = settings.slider_show_value !== false;
    const showTicks = settings.slider_show_ticks ?? false;
    const minLabel = settings.slider_min_label;
    const maxLabel = settings.slider_max_label;

    // Get current value from response data
    const rawValue = responseData.get(question.code);
    const currentValue = rawValue !== undefined && rawValue !== ''
        ? parseFloat(rawValue)
        : min;

    // Calculate tick marks for discrete values
    const tickMarks = useMemo(() => {
        if (!showTicks) return [];

        const ticks: number[] = [];
        const range = max - min;

        // Limit tick marks to a reasonable number for display
        const maxTicks = 20;
        const effectiveStep = range / maxTicks > step
            ? Math.ceil(range / maxTicks / step) * step
            : step;

        for (let value = min; value <= max; value += effectiveStep) {
            ticks.push(value);
        }

        // Ensure max is included
        if (ticks[ticks.length - 1] !== max) {
            ticks.push(max);
        }

        return ticks;
    }, [min, max, step, showTicks]);

    // Calculate percentage for styling the filled track
    const percentage = useMemo(() => {
        return ((currentValue - min) / (max - min)) * 100;
    }, [currentValue, min, max]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onAnswer(question.code, value);
    }, [question.code, onAnswer]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        // Enhanced keyboard navigation
        let newValue = currentValue;

        switch (e.key) {
            case 'Home':
                e.preventDefault();
                newValue = min;
                break;
            case 'End':
                e.preventDefault();
                newValue = max;
                break;
            case 'PageUp':
                e.preventDefault();
                // Large step: 10% of range or 10 steps
                newValue = Math.min(max, currentValue + Math.max(step * 10, (max - min) * 0.1));
                break;
            case 'PageDown':
                e.preventDefault();
                newValue = Math.max(min, currentValue - Math.max(step * 10, (max - min) * 0.1));
                break;
            default:
                return;
        }

        // Round to nearest step
        newValue = Math.round(newValue / step) * step;
        onAnswer(question.code, newValue.toString());
    }, [currentValue, min, max, step, question.code, onAnswer]);

    return (
        <div className="slider-question">
            <div
                className="slider-container"
                role="group"
                aria-labelledby={`${sliderId}-label`}
            >
                {/* Min label */}
                <span
                    className="slider-endpoint-label min-label"
                    aria-hidden="true"
                >
                    {minLabel || min}
                </span>

                {/* Slider track and input */}
                <div className="slider-track-wrapper">
                    {/* Custom track background */}
                    <div
                        className="slider-track-background"
                        aria-hidden="true"
                    >
                        <div
                            className="slider-track-fill"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    {/* Native range input */}
                    <input
                        id={sliderId}
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={currentValue}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className="slider-input"
                        aria-label={question.question_text}
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={currentValue}
                        aria-valuetext={`${currentValue}`}
                    />

                    {/* Tick marks */}
                    {showTicks && tickMarks.length > 0 && (
                        <div className="slider-ticks" aria-hidden="true">
                            {tickMarks.map((tick) => {
                                const tickPercentage = ((tick - min) / (max - min)) * 100;
                                return (
                                    <div
                                        key={tick}
                                        className="slider-tick"
                                        style={{ left: `${tickPercentage}%` }}
                                    >
                                        <div className="tick-mark" />
                                        <span className="tick-label">{tick}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Max label */}
                <span
                    className="slider-endpoint-label max-label"
                    aria-hidden="true"
                >
                    {maxLabel || max}
                </span>
            </div>

            {/* Current value display */}
            {showValue && (
                <div className="slider-value-display" aria-live="polite">
                    <span className="value-label">Selected value:</span>
                    <span className="value-number">{currentValue}</span>
                </div>
            )}

            {/* Screen reader description */}
            <div className="sr-only" id={`${sliderId}-label`}>
                Slider from {min} to {max}, step {step}. Use arrow keys to adjust, Home for minimum, End for maximum.
            </div>

            <style jsx>{`
                .slider-question {
                    margin: 1rem 0;
                    padding: 0.5rem 0;
                }

                .slider-container {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 0 0.5rem;
                }

                .slider-endpoint-label {
                    font-size: 0.875rem;
                    color: #555;
                    min-width: 3rem;
                    flex-shrink: 0;
                    padding-top: 0.25rem;
                }

                .min-label {
                    text-align: right;
                }

                .max-label {
                    text-align: left;
                }

                .slider-track-wrapper {
                    flex: 1;
                    position: relative;
                    height: 40px;
                    padding-top: 8px;
                }

                .slider-track-background {
                    position: absolute;
                    top: 14px;
                    left: 0;
                    right: 0;
                    height: 6px;
                    background: #e0ddd8;
                    border-radius: 3px;
                    pointer-events: none;
                }

                .slider-track-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #c94a4a 0%, #b03a3a 100%);
                    border-radius: 3px;
                    transition: width 0.1s ease-out;
                }

                .slider-input {
                    position: relative;
                    width: 100%;
                    height: 20px;
                    margin: 0;
                    background: transparent;
                    -webkit-appearance: none;
                    appearance: none;
                    cursor: pointer;
                    z-index: 2;
                }

                .slider-input:focus {
                    outline: none;
                }

                .slider-input:focus-visible {
                    outline: 2px solid #c94a4a;
                    outline-offset: 4px;
                    border-radius: 4px;
                }

                /* Webkit (Chrome, Safari, Edge) thumb */
                .slider-input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #c94a4a;
                    cursor: pointer;
                    border: 3px solid #fff;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                    margin-top: -8px;
                }

                .slider-input::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
                }

                .slider-input::-webkit-slider-thumb:active {
                    transform: scale(1.05);
                    background: #b03a3a;
                }

                /* Firefox thumb */
                .slider-input::-moz-range-thumb {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #c94a4a;
                    cursor: pointer;
                    border: 3px solid #fff;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }

                .slider-input::-moz-range-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
                }

                .slider-input::-moz-range-thumb:active {
                    transform: scale(1.05);
                    background: #b03a3a;
                }

                /* Webkit track (made transparent since we use custom track) */
                .slider-input::-webkit-slider-runnable-track {
                    height: 6px;
                    background: transparent;
                    border-radius: 3px;
                }

                /* Firefox track */
                .slider-input::-moz-range-track {
                    height: 6px;
                    background: transparent;
                    border-radius: 3px;
                }

                /* Tick marks */
                .slider-ticks {
                    position: absolute;
                    top: 26px;
                    left: 0;
                    right: 0;
                    height: 24px;
                    pointer-events: none;
                }

                .slider-tick {
                    position: absolute;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    transform: translateX(-50%);
                }

                .tick-mark {
                    width: 1px;
                    height: 6px;
                    background: #bbb;
                }

                .tick-label {
                    font-size: 0.7rem;
                    color: #888;
                    margin-top: 2px;
                    white-space: nowrap;
                }

                /* Value display */
                .slider-value-display {
                    display: flex;
                    justify-content: center;
                    align-items: baseline;
                    gap: 0.5rem;
                    margin-top: ${showTicks ? '2rem' : '1rem'};
                    padding: 0.75rem 1rem;
                    background: #fafaf8;
                    border: 1px solid #e0ddd8;
                    border-radius: 6px;
                    max-width: 200px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .value-label {
                    font-size: 0.85rem;
                    color: #666;
                }

                .value-number {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #c94a4a;
                    font-variant-numeric: tabular-nums;
                }

                /* Screen reader only */
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }

                /* Mobile styles */
                @media (max-width: 768px) {
                    .slider-container {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 0.5rem;
                    }

                    .slider-endpoint-label {
                        display: none;
                    }

                    .slider-track-wrapper {
                        height: ${showTicks ? '60px' : '40px'};
                    }

                    .slider-input::-webkit-slider-thumb {
                        width: 28px;
                        height: 28px;
                        margin-top: -11px;
                    }

                    .slider-input::-moz-range-thumb {
                        width: 28px;
                        height: 28px;
                    }

                    /* Show min/max below slider on mobile */
                    .slider-ticks {
                        top: 32px;
                    }

                    .slider-value-display {
                        max-width: none;
                    }
                }

                @media (max-width: 480px) {
                    .tick-label {
                        font-size: 0.65rem;
                    }
                }
            `}</style>
        </div>
    );
}
