// Multiple Short Text Question Component (LimeSurvey Type Q)
// Multiple labeled text inputs using subquestions
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface MultipleShortTextQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function MultipleShortTextQuestion({ question, responseData, onAnswer }: MultipleShortTextQuestionProps) {
    const subquestions = question.subquestions.sort((a, b) => a.order_index - b.order_index);
    const settings = question.settings || {};

    const handleChange = (subquestionCode: string, value: string) => {
        onAnswer(question.code, value, subquestionCode);
    };

    return (
        <div className="multiple-short-text-question">
            <div className="inputs-list">
                {subquestions.map(subq => {
                    const key = `${question.code}_${subq.code}`;
                    const currentValue = responseData.get(key) || '';

                    return (
                        <div key={subq.id} className="input-row">
                            <label className="input-label" htmlFor={key}>
                                {subq.label}
                            </label>
                            <input
                                type="text"
                                id={key}
                                value={currentValue}
                                onChange={(e) => handleChange(subq.code, e.target.value)}
                                placeholder={settings.placeholder || ''}
                                maxLength={settings.max_answers}
                                className="text-input"
                            />
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .multiple-short-text-question {
                    margin: 1rem 0;
                }

                .inputs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .input-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .input-label {
                    min-width: 150px;
                    font-size: 0.9rem;
                    color: #333;
                    flex-shrink: 0;
                }

                .text-input {
                    flex: 1;
                    padding: 0.625rem 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 0.95rem;
                    color: #333;
                    background: white;
                    max-width: 400px;
                }

                .text-input:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 2px rgba(201, 74, 74, 0.1);
                }

                .text-input::placeholder {
                    color: #999;
                }

                @media (max-width: 768px) {
                    .input-row {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }

                    .input-label {
                        min-width: unset;
                    }

                    .text-input {
                        width: 100%;
                        max-width: none;
                        font-size: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
