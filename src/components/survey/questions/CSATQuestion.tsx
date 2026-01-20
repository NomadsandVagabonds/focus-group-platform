// CSAT (Customer Satisfaction) Question Component
// 1-5 Star Rating
'use client';

import { useState } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface CSATQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function CSATQuestion({ question, responseData, onAnswer }: CSATQuestionProps) {
    const currentValue = responseData.get(question.code);
    const currentValueNum = currentValue !== undefined && currentValue !== '' ? parseInt(currentValue, 10) : 0;
    const [hoverValue, setHoverValue] = useState<number>(0);
    const settings = question.settings || {};

    const handleSelect = (value: number) => {
        onAnswer(question.code, value.toString());
    };

    return (
        <div className="csat-question">
            <div
                className="stars-container"
                onMouseLeave={() => setHoverValue(0)}
                role="radiogroup"
                aria-label={question.question_text}
            >
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverValue || currentValueNum) >= star;
                    const isHovered = hoverValue >= star;

                    return (
                        <button
                            key={star}
                            type="button"
                            className={`star-btn ${isFilled ? 'filled' : ''} ${isHovered ? 'hovered' : ''}`}
                            onClick={() => handleSelect(star)}
                            onMouseEnter={() => setHoverValue(star)}
                            onFocus={() => setHoverValue(star)}
                            onBlur={() => setHoverValue(0)}
                            aria-checked={currentValueNum === star}
                            role="radio"
                            aria-label={`${star} Stars`}
                        >
                            ★
                        </button>
                    );
                })}
            </div>

            <div className="rating-feedback">
                {currentValueNum > 0 && (
                    <span className="selected-text">
                        {currentValueNum} Star{currentValueNum !== 1 ? 's' : ''}
                    </span>
                )}
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
                .csat-question {
                    margin: 1rem 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .stars-container {
                    display: flex;
                    gap: 0.5rem;
                }

                .star-btn {
                    background: none;
                    border: none;
                    font-size: 3rem;
                    color: #ddd;
                    cursor: pointer;
                    transition: color 0.2s, transform 0.1s;
                    line-height: 1;
                    padding: 0 0.25rem;
                }

                .star-btn.filled {
                    color: #fbbf24; /* Amber-400 */
                }

                .star-btn.hovered {
                    color: #f59e0b; /* Amber-500 */
                    transform: scale(1.1);
                }

                .star-btn:focus {
                    outline: none;
                    text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
                }

                .rating-feedback {
                    min-height: 1.5rem;
                    margin-top: 0.5rem;
                    font-weight: 500;
                    color: #666;
                }

                .no-answer-btn {
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    color: #666;
                    cursor: pointer;
                }
                
                .no-answer-btn:hover {
                    background: #f5f3ef;
                }

                .no-answer-btn.selected {
                    background: #e0ddd8;
                    color: #333;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .stars-container {
                        gap: 0.25rem;
                    }

                    .star-btn {
                        font-size: 2.5rem;
                        min-width: 44px;
                        min-height: 44px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .no-answer-btn {
                        min-height: 44px;
                        padding: 0.75rem 1.5rem;
                    }
                }

                @media (max-width: 375px) {
                    .star-btn {
                        font-size: 2rem;
                        padding: 0 0.125rem;
                    }
                }
            `}</style>
        </div>
    );
}
