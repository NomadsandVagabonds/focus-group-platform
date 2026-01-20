// Dropdown Question Component
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface DropdownQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function DropdownQuestion({ question, responseData, onAnswer }: DropdownQuestionProps) {
    const currentValue = responseData.get(question.code) || '';
    const answerOptions = question.answer_options.sort((a, b) => a.order_index - b.order_index);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onAnswer(question.code, e.target.value);
    };

    return (
        <div className="dropdown-question">
            <select
                id={question.code}
                name={question.code}
                value={currentValue}
                onChange={handleChange}
                className="dropdown-select"
            >
                <option value="">
                    {question.settings.placeholder || 'Please select...'}
                </option>
                {answerOptions.map(option => (
                    <option key={option.id} value={option.code}>
                        {option.label}
                    </option>
                ))}
            </select>

            <style jsx>{`
                .dropdown-question {
                    width: 100%;
                }

                .dropdown-select {
                    width: 100%;
                    max-width: 400px;
                    padding: 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 1rem;
                    color: #1a1d24;
                    background: white;
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231a1d24' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 0.75rem center;
                    padding-right: 2.5rem;
                }

                .dropdown-select:focus {
                    outline: none;
                    border-color: #c94a4a;
                }

                .dropdown-select:invalid,
                .dropdown-select option[value=""] {
                    color: #999;
                }

                @media (max-width: 768px) {
                    .dropdown-select {
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
