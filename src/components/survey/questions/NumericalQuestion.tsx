// Numerical Input Question Component
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface NumericalQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function NumericalQuestion({ question, responseData, onAnswer }: NumericalQuestionProps) {
    const currentValue = responseData.get(question.code) ?? '';
    const settings = question.settings || {};

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Allow empty value
        if (value === '') {
            onAnswer(question.code, '');
            return;
        }

        // Validate it's a valid number format (allow negative and decimals)
        if (!/^-?\d*\.?\d*$/.test(value)) {
            return;
        }

        onAnswer(question.code, value);
    };

    const handleBlur = () => {
        // On blur, validate against min/max and format decimals
        if (currentValue === '' || currentValue === '-') return;

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
            onAnswer(question.code, num.toFixed(settings.decimal_places));
        } else {
            onAnswer(question.code, num.toString());
        }
    };

    // Calculate step based on decimal places
    const step = settings.decimal_places
        ? Math.pow(10, -settings.decimal_places).toString()
        : '1';

    return (
        <div className="numerical-question">
            <div className="input-wrapper">
                {settings.prefix && <span className="prefix">{settings.prefix}</span>}
                <input
                    type="text"
                    inputMode="decimal"
                    value={currentValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={settings.placeholder || ''}
                    className="number-input"
                    aria-label={question.question_text}
                />
                {settings.suffix && <span className="suffix">{settings.suffix}</span>}
            </div>

            {(settings.min_value !== undefined || settings.max_value !== undefined) && (
                <div className="validation-hint">
                    {settings.min_value !== undefined && settings.max_value !== undefined
                        ? `Enter a number between ${settings.min_value} and ${settings.max_value}`
                        : settings.min_value !== undefined
                            ? `Minimum: ${settings.min_value}`
                            : `Maximum: ${settings.max_value}`}
                </div>
            )}

            <style jsx>{`
                .numerical-question {
                    margin: 1rem 0;
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
                    width: 150px;
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
                    margin-top: 0.5rem;
                    font-style: italic;
                }

                @media (max-width: 768px) {
                    .number-input {
                        width: 120px;
                        padding: 8px 10px;
                        font-size: 16px; /* Prevents zoom on iOS */
                    }

                    .prefix, .suffix {
                        font-size: 0.85rem;
                    }
                }

                @media (max-width: 480px) {
                    .input-wrapper {
                        flex-wrap: wrap;
                    }

                    .number-input {
                        width: 100%;
                        max-width: 200px;
                    }
                }
            `}</style>
        </div>
    );
}
