// Image Multi-Select Question (Theme variant of Multiple Choice)
// Shows images for each answer option with multi-select capability
'use client';

import { useMemo } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface ImageMultiSelectQuestionProps {
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

// Extended answer option with image URL
interface ImageAnswerOption extends AnswerOption {
    image_url?: string;
}

export default function ImageMultiSelectQuestion({
    question,
    responseData,
    onAnswer,
    randomizationSeed
}: ImageMultiSelectQuestionProps) {
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

    // Get options from answer_options (expect image_url in each option)
    const options = useMemo(() => {
        let opts = [...(question.answer_options || [])] as ImageAnswerOption[];
        opts = opts.sort((a, b) => a.order_index - b.order_index);

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

    // Layout options
    const columns = settings.display_columns || 3;
    const showLabels = settings.image_show_labels !== false;
    const imageSize = settings.image_size || 'medium'; // small, medium, large

    const sizeMap = {
        small: '100px',
        medium: '150px',
        large: '200px',
    };

    return (
        <div className="image-multi-select-question">
            <div className="image-grid">
                {options.map((option) => {
                    const isSelected = selectedCodes.has(option.code);

                    return (
                        <button
                            key={option.id}
                            type="button"
                            className={`image-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleToggle(option.code)}
                            aria-pressed={isSelected}
                            aria-label={option.label}
                        >
                            <div className="image-wrapper">
                                {option.image_url ? (
                                    <img
                                        src={option.image_url}
                                        alt={option.label}
                                        className="option-image"
                                    />
                                ) : (
                                    <div className="image-placeholder">
                                        <span className="placeholder-icon">🖼️</span>
                                        <span className="placeholder-text">No image</span>
                                    </div>
                                )}
                                <div className={`selection-indicator ${isSelected ? 'selected' : ''}`}>
                                    <span className="check-icon">{isSelected ? '✓' : ''}</span>
                                </div>
                            </div>
                            {showLabels && (
                                <span className="option-label">{option.label}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <style jsx>{`
                .image-multi-select-question {
                    width: 100%;
                }

                .image-grid {
                    display: grid;
                    grid-template-columns: repeat(${columns}, 1fr);
                    gap: 1rem;
                }

                .image-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    border: 2px solid #e0ddd8;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .image-option:hover {
                    border-color: #c94a4a;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .image-option.selected {
                    border-color: #c94a4a;
                    background: #faf5f5;
                }

                .image-option:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.2);
                }

                .image-wrapper {
                    position: relative;
                    width: 100%;
                    height: ${sizeMap[imageSize as keyof typeof sizeMap]};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border-radius: 4px;
                    background: #f5f3ef;
                }

                .option-image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }

                .image-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    color: #999;
                }

                .placeholder-icon {
                    font-size: 2rem;
                }

                .placeholder-text {
                    font-size: 0.75rem;
                }

                .selection-indicator {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    width: 24px;
                    height: 24px;
                    background: white;
                    border: 2px solid #e0ddd8;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .selection-indicator.selected {
                    background: #c94a4a;
                    border-color: #c94a4a;
                }

                .check-icon {
                    color: white;
                    font-size: 0.875rem;
                    font-weight: bold;
                }

                .option-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1a1d24;
                    text-align: center;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .image-option.selected .option-label {
                    color: #c94a4a;
                }

                @media (max-width: 768px) {
                    .image-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .image-wrapper {
                        height: 120px;
                    }
                }

                @media (max-width: 480px) {
                    .image-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
