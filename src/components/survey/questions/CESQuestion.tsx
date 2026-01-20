// CES (Customer Effort Score) Question Component
// 1-7 Scale (Very Difficult -> Very Easy)
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface CESQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

const CES_LABELS: Record<number, string> = {
    1: 'Very Difficult',
    2: 'Difficult',
    3: 'Somewhat Difficult',
    4: 'Neutral',
    5: 'Somewhat Easy',
    6: 'Easy',
    7: 'Very Easy'
};

export default function CESQuestion({ question, responseData, onAnswer }: CESQuestionProps) {
    const currentValue = responseData.get(question.code);
    const currentValueNum = currentValue !== undefined && currentValue !== '' ? parseInt(currentValue, 10) : null;
    const settings = question.settings || {};

    const handleSelect = (value: number) => {
        onAnswer(question.code, value.toString());
    };

    return (
        <div className="ces-question">
            <div className="scale-container">
                {[1, 2, 3, 4, 5, 6, 7].map(value => {
                    const isSelected = currentValueNum === value;
                    const label = CES_LABELS[value];

                    // Determine color class based on value (Red -> Green)
                    let colorClass = 'neutral';
                    if (value <= 3) colorClass = 'difficult';
                    if (value >= 5) colorClass = 'easy';

                    return (
                        <button
                            key={value}
                            type="button"
                            className={`ces-option ${colorClass} ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelect(value)}
                            aria-pressed={isSelected}
                            aria-label={`${value} - ${label}`}
                        >
                            <span className="value-number">{value}</span>
                            <span className="value-label">{label}</span>
                        </button>
                    );
                })}
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
                .ces-question {
                    margin: 1rem 0;
                }

                .scale-container {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .ces-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 70px;
                    height: 80px;
                    padding: 0.5rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .value-number {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                    color: #374151;
                }

                .value-label {
                    font-size: 0.65rem;
                    text-align: center;
                    line-height: 1.1;
                    color: #6b7280;
                }

                /* Color styling */
                .ces-option.difficult:hover, .ces-option.difficult.selected {
                    border-color: #f87171;
                    background: #fef2f2;
                }
                .ces-option.difficult.selected .value-number { color: #dc2626; }

                .ces-option.neutral:hover, .ces-option.neutral.selected {
                    border-color: #fbbf24;
                    background: #fffbeb;
                }
                .ces-option.neutral.selected .value-number { color: #d97706; }

                .ces-option.easy:hover, .ces-option.easy.selected {
                    border-color: #4ade80;
                    background: #f0fdf4;
                }
                .ces-option.easy.selected .value-number { color: #16a34a; }

                .ces-option.selected {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .no-answer-btn {
                    display: block;
                    margin: 1.5rem auto 0;
                    padding: 0.5rem 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    color: #666;
                    cursor: pointer;
                }

                .no-answer-btn.selected {
                    background: #e0ddd8;
                    color: #333;
                }

                @media (max-width: 600px) {
                    .scale-container {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 0.25rem;
                    }

                    .ces-option {
                        width: 100%;
                        height: 48px;
                        flex-direction: row;
                        justify-content: flex-start;
                        padding: 0 1rem;
                        gap: 1rem;
                    }

                    .value-number {
                        margin-bottom: 0;
                        width: 1.5rem;
                    }

                    .value-label {
                        font-size: 0.9rem;
                        text-align: left;
                    }
                }
            `}</style>
        </div>
    );
}
