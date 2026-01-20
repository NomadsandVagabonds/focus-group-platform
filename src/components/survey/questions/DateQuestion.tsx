// Date Question Component (LimeSurvey Type D)
// Supports date-only or datetime based on settings
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface DateQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function DateQuestion({ question, responseData, onAnswer }: DateQuestionProps) {
    const currentValue = responseData.get(question.code) || '';

    // Check if time selection is enabled via settings
    const includeTime = question.settings?.date_include_time === true;
    const dateFormat = question.settings?.date_format || 'default';

    // Min/max date constraints
    const minDate = question.settings?.date_min;
    const maxDate = question.settings?.date_max;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onAnswer(question.code, e.target.value);
    };

    // Format display based on settings
    const inputType = includeTime ? 'datetime-local' : 'date';
    const maxWidth = includeTime ? '280px' : '200px';

    return (
        <div className="date-question">
            <div className="date-input-wrapper">
                <input
                    type={inputType}
                    id={question.code}
                    name={question.code}
                    value={currentValue}
                    onChange={handleChange}
                    className="date-input"
                    min={minDate}
                    max={maxDate}
                    aria-label={includeTime ? 'Select date and time' : 'Select date'}
                />
                {includeTime && (
                    <span className="time-hint">Date & Time</span>
                )}
            </div>

            <style jsx>{`
                .date-question {
                    width: 100%;
                }

                .date-input-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .date-input {
                    width: 100%;
                    max-width: ${maxWidth};
                    padding: 0.75rem;
                    border: 2px solid #e0ddd8;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 1rem;
                    color: #1a1d24;
                    background: white;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }

                .date-input:hover {
                    border-color: #c94a4a;
                }

                .date-input:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.2);
                }

                .date-input::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 2px;
                }

                .date-input::-webkit-calendar-picker-indicator:hover {
                    background: #f5f3ef;
                }

                .time-hint {
                    font-size: 0.75rem;
                    color: #666;
                }

                @media (max-width: 768px) {
                    .date-input {
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
