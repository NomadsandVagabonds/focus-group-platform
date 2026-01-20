// 5 Point Choice Question Component (LimeSurvey Type 5)
// Horizontal 1-5 scale, single row selection
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface FivePointChoiceQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function FivePointChoiceQuestion({ question, responseData, onAnswer }: FivePointChoiceQuestionProps) {
    const currentValue = responseData.get(question.code);
    const settings = question.settings || {};

    const handleSelect = (value: number) => {
        onAnswer(question.code, value.toString());
    };

    // Default labels if not provided
    const lowLabel = settings.scale_low_label || '1';
    const highLabel = settings.scale_high_label || '5';

    return (
        <div className="five-point-choice-question">
            <div className="scale-container">
                <span className="scale-label low-label">{lowLabel}</span>
                <div className="scale-buttons">
                    {[1, 2, 3, 4, 5].map(value => (
                        <button
                            key={value}
                            type="button"
                            className={`scale-button ${currentValue === value.toString() ? 'selected' : ''}`}
                            onClick={() => handleSelect(value)}
                            aria-pressed={currentValue === value.toString()}
                        >
                            {value}
                        </button>
                    ))}
                </div>
                <span className="scale-label high-label">{highLabel}</span>
            </div>

            {settings.show_no_answer && (
                <button
                    type="button"
                    className={`no-answer-btn ${currentValue === '' ? 'selected' : ''}`}
                    onClick={() => onAnswer(question.code, '')}
                >
                    No answer
                </button>
            )}

            <style jsx>{`
                .five-point-choice-question {
                    margin: 1rem 0;
                }

                .scale-container {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    justify-content: center;
                }

                .scale-label {
                    font-size: 0.875rem;
                    color: #666;
                    min-width: 60px;
                }

                .low-label {
                    text-align: right;
                }

                .high-label {
                    text-align: left;
                }

                .scale-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .scale-button {
                    width: 44px;
                    height: 44px;
                    border: 2px solid #ddd;
                    border-radius: 50%;
                    background: white;
                    font-size: 1rem;
                    font-weight: 500;
                    color: #333;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .scale-button:hover {
                    border-color: #c94a4a;
                    background: #faf5f5;
                }

                .scale-button.selected {
                    border-color: #c94a4a;
                    background: #c94a4a;
                    color: white;
                }

                .scale-button:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.2);
                }

                .no-answer-btn {
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    font-size: 0.875rem;
                    color: #666;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .no-answer-btn:hover {
                    background: #f5f3ef;
                }

                .no-answer-btn.selected {
                    background: #e0ddd8;
                    color: #333;
                }

                @media (max-width: 768px) {
                    .scale-container {
                        flex-wrap: wrap;
                        gap: 0.75rem;
                    }

                    .scale-label {
                        min-width: unset;
                        order: 2;
                    }

                    .low-label {
                        text-align: center;
                        order: 1;
                    }

                    .high-label {
                        text-align: center;
                        order: 3;
                    }

                    .scale-buttons {
                        width: 100%;
                        justify-content: center;
                        order: 2;
                    }

                    .scale-button {
                        width: 40px;
                        height: 40px;
                    }
                }

                @media (max-width: 375px) {
                    .scale-button {
                        width: 36px;
                        height: 36px;
                        font-size: 0.9rem;
                    }

                    .scale-buttons {
                        gap: 0.375rem;
                    }
                }
            `}</style>
        </div>
    );
}
