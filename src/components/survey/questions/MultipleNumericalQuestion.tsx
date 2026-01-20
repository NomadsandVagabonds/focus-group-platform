// Multiple Numerical Question Component
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface MultipleNumericalQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function MultipleNumericalQuestion({ question, responseData, onAnswer }: MultipleNumericalQuestionProps) {
    const subquestions = question.subquestions.sort((a, b) => a.order_index - b.order_index);
    const settings = question.settings || {};

    const handleChange = (subquestionCode: string, value: string) => {
        // Allow empty value
        if (value === '') {
            onAnswer(question.code, '', subquestionCode);
            return;
        }

        // Validate it's a valid number format
        if (!/^-?\d*\.?\d*$/.test(value)) {
            return;
        }

        onAnswer(question.code, value, subquestionCode);
    };

    const handleBlur = (subquestionCode: string) => {
        const key = `${question.code}_${subquestionCode}`;
        const currentValue = responseData.get(key);

        if (!currentValue || currentValue === '' || currentValue === '-') return;

        let num = parseFloat(currentValue);
        if (isNaN(num)) return;

        // Clamp to min/max
        if (settings.min_value !== undefined && num < settings.min_value) {
            num = settings.min_value;
        }
        if (settings.max_value !== undefined && num > settings.max_value) {
            num = settings.max_value;
        }

        // Format decimal places
        if (settings.decimal_places !== undefined) {
            onAnswer(question.code, num.toFixed(settings.decimal_places), subquestionCode);
        } else {
            onAnswer(question.code, num.toString(), subquestionCode);
        }
    };

    return (
        <div className="multiple-numerical-question">
            <div className="inputs-list">
                {subquestions.map(subq => {
                    const key = `${question.code}_${subq.code}`;
                    const currentValue = responseData.get(key) ?? '';

                    return (
                        <div key={subq.id} className="input-row">
                            <label className="input-label" htmlFor={key}>
                                {subq.label}
                            </label>
                            <div className="input-wrapper">
                                {settings.prefix && <span className="prefix">{settings.prefix}</span>}
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    id={key}
                                    value={currentValue}
                                    onChange={(e) => handleChange(subq.code, e.target.value)}
                                    onBlur={() => handleBlur(subq.code)}
                                    placeholder={settings.placeholder || ''}
                                    className="number-input"
                                />
                                {settings.suffix && <span className="suffix">{settings.suffix}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {(settings.min_value !== undefined || settings.max_value !== undefined) && (
                <div className="validation-hint">
                    {settings.min_value !== undefined && settings.max_value !== undefined
                        ? `Enter numbers between ${settings.min_value} and ${settings.max_value}`
                        : settings.min_value !== undefined
                            ? `Minimum: ${settings.min_value}`
                            : `Maximum: ${settings.max_value}`}
                </div>
            )}

            <style jsx>{`
                .multiple-numerical-question {
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
                }

                .input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .prefix, .suffix {
                    color: #666;
                    font-size: 0.9rem;
                    white-space: nowrap;
                }

                .number-input {
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.95rem;
                    width: 120px;
                    font-family: inherit;
                    color: #333;
                    background: white;
                }

                .number-input:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 2px rgba(201, 74, 74, 0.1);
                }

                .number-input::placeholder {
                    color: #999;
                }

                .validation-hint {
                    font-size: 0.8rem;
                    color: #666;
                    margin-top: 0.75rem;
                    font-style: italic;
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

                    .number-input {
                        width: 150px;
                        padding: 8px 10px;
                        font-size: 16px;
                    }

                    .prefix, .suffix {
                        font-size: 0.85rem;
                    }
                }

                @media (max-width: 480px) {
                    .number-input {
                        width: 100%;
                        max-width: 200px;
                    }
                }
            `}</style>
        </div>
    );
}
