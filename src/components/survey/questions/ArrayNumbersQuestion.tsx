// Array (Numbers) Question Component
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface ArrayNumbersQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function ArrayNumbersQuestion({ question, responseData, onAnswer }: ArrayNumbersQuestionProps) {
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
        <div className="array-numbers-question">
            <div className="array-table">
                <table>
                    <thead>
                        <tr>
                            <th className="subquestion-header"></th>
                            <th className="value-header">
                                {settings.suffix || 'Value'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {subquestions.map(subq => {
                            const key = `${question.code}_${subq.code}`;
                            const currentValue = responseData.get(key) ?? '';

                            return (
                                <tr key={subq.id}>
                                    <td className="subquestion-label">{subq.label}</td>
                                    <td className="value-cell">
                                        <div className="input-wrapper">
                                            {settings.prefix && <span className="prefix">{settings.prefix}</span>}
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={currentValue}
                                                onChange={(e) => handleChange(subq.code, e.target.value)}
                                                onBlur={() => handleBlur(subq.code)}
                                                placeholder={settings.placeholder || ''}
                                                className="number-input"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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
                .array-numbers-question {
                    overflow-x: auto;
                    margin: 1rem 0;
                }

                .array-table table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border: 1px solid #ddd;
                }

                .array-table th,
                .array-table td {
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    font-size: 0.875rem;
                }

                .subquestion-header {
                    background: #f8f8f8;
                    font-weight: 500;
                    text-align: left;
                    width: 60%;
                }

                .value-header {
                    background: #f8f8f8;
                    font-weight: 500;
                    text-align: center;
                    min-width: 120px;
                    font-size: 0.8125rem;
                }

                .subquestion-label {
                    font-weight: normal;
                    color: #333;
                    text-align: left;
                }

                .value-cell {
                    text-align: center;
                    background: #fff;
                }

                .input-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.25rem;
                }

                .prefix {
                    color: #666;
                    font-size: 0.85rem;
                }

                .number-input {
                    padding: 8px 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    width: 100px;
                    text-align: center;
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
                    .array-table {
                        font-size: 0.8rem;
                    }

                    .array-table th,
                    .array-table td {
                        padding: 8px 6px;
                    }

                    .value-header {
                        min-width: 100px;
                        font-size: 0.75rem;
                    }

                    .number-input {
                        width: 80px;
                        padding: 6px 8px;
                        font-size: 16px;
                    }
                }

                @media (max-width: 480px) {
                    .array-numbers-question {
                        margin: 0 -1rem;
                    }

                    .array-table th,
                    .array-table td {
                        padding: 6px 4px;
                        font-size: 0.7rem;
                    }

                    .number-input {
                        width: 70px;
                        padding: 4px 6px;
                    }
                }
            `}</style>
        </div>
    );
}
