// Bootstrap Button Multi-Select Question (Theme variant of Multiple Choice)
// Styled button layout for multiple choice selection
'use client';

import { useMemo } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface ButtonMultiSelectQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
    randomizationSeed?: string;
}

// Seeded shuffle function for stable randomization
function seededShuffle<T>(array: T[], seed: string): T[] {
    const result = [...array];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    const random = () => {
        hash |= 0;
        hash = hash + 0x6D2B79F5 | 0;
        let t = Math.imul(hash ^ hash >>> 15, 1 | hash);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

export default function ButtonMultiSelectQuestion({
    question,
    responseData,
    onAnswer,
    randomizationSeed
}: ButtonMultiSelectQuestionProps) {
    const settings = question.settings || {};

    // Get current selections as a Set
    const selectedCodes = useMemo(() => {
        const selected = new Set<string>();
        // Check for individual answer keys (standard multiple choice format)
        (question.answer_options || []).forEach(opt => {
            if (responseData.get(`${question.code}_${opt.code}`)) {
                selected.add(opt.code);
            }
        });
        return selected;
    }, [question, responseData]);

    // Get options from answer_options OR subquestions (LimeSurvey M type uses subquestions)
    const options = useMemo(() => {
        // Try answer_options first, then fall back to subquestions (LimeSurvey format)
        let opts: Array<{ id: string; code: string; label: string; order_index: number }> = [];

        if (question.answer_options && question.answer_options.length > 0) {
            opts = question.answer_options.map(opt => ({
                id: opt.id,
                code: opt.code,
                label: opt.label,
                order_index: opt.order_index
            }));
        } else if (question.subquestions && question.subquestions.length > 0) {
            // LimeSurvey M type stores options as subquestions
            opts = question.subquestions.map(sq => ({
                id: sq.id,
                code: sq.code,
                label: sq.label,
                order_index: sq.order_index
            }));
        }

        opts.sort((a, b) => a.order_index - b.order_index);

        if (settings.randomize_answers && randomizationSeed) {
            opts = seededShuffle(opts, `${randomizationSeed}_${question.code}`);
        }

        return opts;
    }, [question, settings.randomize_answers, randomizationSeed]);

    const handleToggle = (code: string) => {
        const isSelected = selectedCodes.has(code);
        const exclusiveOption = settings.exclusive_option;

        // If selecting an exclusive option, deselect all others
        if (!isSelected && exclusiveOption === code) {
            // Deselect all other options
            options.forEach(opt => {
                if (opt.code !== code) {
                    onAnswer(question.code, '', opt.code);
                }
            });
            onAnswer(question.code, 'Y', code);
        }
        // If selecting a non-exclusive option while exclusive is selected, deselect exclusive
        else if (!isSelected && exclusiveOption && selectedCodes.has(exclusiveOption)) {
            onAnswer(question.code, '', exclusiveOption);
            onAnswer(question.code, 'Y', code);
        }
        // Normal toggle
        else {
            onAnswer(question.code, isSelected ? '' : 'Y', code);
        }
    };

    // Layout: horizontal, vertical, or grid
    const layout = settings.button_layout || 'horizontal';
    const columns = settings.display_columns || 3;
    const buttonStyle = settings.button_style || 'outline'; // outline, filled, pill

    return (
        <div className={`button-multi-select-question layout-${layout}`}>
            <div className="button-grid" style={layout === 'grid' ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}>
                {options.map((option) => {
                    const isSelected = selectedCodes.has(option.code);
                    const isExclusive = settings.exclusive_option === option.code;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            className={`select-button style-${buttonStyle} ${isSelected ? 'selected' : ''} ${isExclusive ? 'exclusive' : ''}`}
                            onClick={() => handleToggle(option.code)}
                            aria-pressed={isSelected}
                        >
                            <span className="checkbox-indicator">{isSelected ? '✓' : ''}</span>
                            {option.label}
                        </button>
                    );
                })}
            </div>

            {settings.other_option && (
                <div className="other-option">
                    <button
                        type="button"
                        className={`select-button style-${buttonStyle} other ${selectedCodes.has('_other') ? 'selected' : ''}`}
                        onClick={() => handleToggle('_other')}
                    >
                        <span className="checkbox-indicator">{selectedCodes.has('_other') ? '✓' : ''}</span>
                        Other
                    </button>
                    {selectedCodes.has('_other') && (
                        <input
                            type="text"
                            className="other-input"
                            placeholder="Please specify..."
                            value={responseData.get(`${question.code}_other_text`) || ''}
                            onChange={(e) => onAnswer(question.code, e.target.value, '_other_text')}
                        />
                    )}
                </div>
            )}

            <style jsx>{`
                .button-multi-select-question {
                    width: 100%;
                }

                .button-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }

                .layout-vertical .button-grid {
                    flex-direction: column;
                }

                .layout-horizontal .button-grid {
                    flex-direction: row;
                }

                .layout-grid .button-grid {
                    display: grid;
                    gap: 0.75rem;
                }

                .select-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.5rem;
                    font-family: inherit;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    min-width: 120px;
                }

                .checkbox-indicator {
                    width: 20px;
                    height: 20px;
                    border: 2px solid currentColor;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: bold;
                    flex-shrink: 0;
                }

                .selected .checkbox-indicator {
                    background: currentColor;
                    color: white;
                }

                /* Outline style */
                .select-button.style-outline {
                    border: 2px solid #e0ddd8;
                    border-radius: 4px;
                    background: white;
                    color: #1a1d24;
                }

                .select-button.style-outline:hover {
                    border-color: #c94a4a;
                    background: #faf9f7;
                }

                .select-button.style-outline.selected {
                    border-color: #c94a4a;
                    background: #faf5f5;
                    color: #c94a4a;
                }

                .select-button.style-outline.selected .checkbox-indicator {
                    background: #c94a4a;
                    border-color: #c94a4a;
                    color: white;
                }

                /* Filled style */
                .select-button.style-filled {
                    border: none;
                    border-radius: 4px;
                    background: #f5f3ef;
                    color: #1a1d24;
                }

                .select-button.style-filled:hover {
                    background: #e8e5e0;
                }

                .select-button.style-filled.selected {
                    background: #faf5f5;
                    color: #c94a4a;
                }

                .select-button.style-filled .checkbox-indicator {
                    border-color: #999;
                }

                .select-button.style-filled.selected .checkbox-indicator {
                    background: #c94a4a;
                    border-color: #c94a4a;
                    color: white;
                }

                /* Pill style */
                .select-button.style-pill {
                    border: 2px solid #e0ddd8;
                    border-radius: 50px;
                    background: white;
                    color: #1a1d24;
                }

                .select-button.style-pill:hover {
                    border-color: #c94a4a;
                    background: #faf9f7;
                }

                .select-button.style-pill.selected {
                    border-color: #c94a4a;
                    background: #faf5f5;
                    color: #c94a4a;
                }

                .select-button.style-pill .checkbox-indicator {
                    border-radius: 50%;
                }

                .select-button.style-pill.selected .checkbox-indicator {
                    background: #c94a4a;
                    border-color: #c94a4a;
                    color: white;
                }

                /* Exclusive option styling */
                .select-button.exclusive {
                    border-style: dashed;
                }

                .select-button:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.2);
                }

                .other-option {
                    margin-top: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .other-input {
                    padding: 0.75rem;
                    border: 2px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 16px; /* Prevents iOS zoom */
                    font-family: inherit;
                    width: 100%;
                    max-width: 300px;
                    box-sizing: border-box;
                }

                .other-input:focus {
                    outline: none;
                    border-color: #c94a4a;
                }

                @media (max-width: 768px) {
                    .layout-horizontal .button-grid {
                        flex-direction: column;
                    }

                    .select-button {
                        width: 100%;
                        min-width: unset;
                        min-height: 44px; /* Touch target */
                    }

                    .layout-grid .button-grid {
                        grid-template-columns: 1fr !important;
                    }

                    .other-input {
                        max-width: none;
                        padding: 0.875rem;
                    }
                }
            `}</style>
        </div>
    );
}
