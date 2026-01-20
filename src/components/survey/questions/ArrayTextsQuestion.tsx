// Array (Texts) Question Component
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface ArrayTextsQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function ArrayTextsQuestion({ question, responseData, onAnswer }: ArrayTextsQuestionProps) {
    const subquestions = question.subquestions.sort((a, b) => a.order_index - b.order_index);
    const settings = question.settings || {};

    const handleChange = (subquestionCode: string, value: string) => {
        // Check max length if specified
        if (settings.max_answers && value.length > settings.max_answers) {
            return;
        }

        onAnswer(question.code, value, subquestionCode);
    };

    return (
        <div className="array-texts-question">
            <div className="array-table">
                <table>
                    <thead>
                        <tr>
                            <th className="subquestion-header"></th>
                            <th className="text-header">
                                {settings.placeholder || 'Response'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {subquestions.map(subq => {
                            const key = `${question.code}_${subq.code}`;
                            const currentValue = responseData.get(key) || '';

                            return (
                                <tr key={subq.id}>
                                    <td className="subquestion-label">{subq.label}</td>
                                    <td className="text-cell">
                                        <input
                                            type="text"
                                            value={currentValue}
                                            onChange={(e) => handleChange(subq.code, e.target.value)}
                                            placeholder={settings.placeholder || ''}
                                            className="text-input"
                                            maxLength={settings.max_answers}
                                        />
                                        {settings.max_answers && (
                                            <span className="char-count">
                                                {currentValue.length}/{settings.max_answers}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .array-texts-question {
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
                    width: 30%;
                }

                .text-header {
                    background: #f8f8f8;
                    font-weight: 500;
                    text-align: left;
                    font-size: 0.8125rem;
                }

                .subquestion-label {
                    font-weight: normal;
                    color: #333;
                    text-align: left;
                    vertical-align: top;
                    padding-top: 14px;
                }

                .text-cell {
                    text-align: left;
                    background: #fff;
                    position: relative;
                }

                .text-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    font-family: inherit;
                    color: #333;
                    background: white;
                    box-sizing: border-box;
                }

                .text-input:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 2px rgba(201, 74, 74, 0.1);
                }

                .text-input::placeholder {
                    color: #999;
                }

                .char-count {
                    position: absolute;
                    right: 16px;
                    bottom: 8px;
                    font-size: 0.7rem;
                    color: #999;
                }

                @media (max-width: 768px) {
                    .array-table {
                        font-size: 0.8rem;
                    }

                    .array-table th,
                    .array-table td {
                        padding: 8px 6px;
                    }

                    .subquestion-header {
                        width: 35%;
                    }

                    .text-input {
                        padding: 8px 10px;
                        font-size: 16px;
                    }
                }

                @media (max-width: 480px) {
                    .array-texts-question {
                        margin: 0 -1rem;
                    }

                    .array-table th,
                    .array-table td {
                        padding: 6px 4px;
                        font-size: 0.75rem;
                    }

                    .subquestion-header {
                        width: 40%;
                    }

                    .text-input {
                        padding: 6px 8px;
                    }

                    .char-count {
                        right: 8px;
                        bottom: 4px;
                        font-size: 0.65rem;
                    }
                }
            `}</style>
        </div>
    );
}
