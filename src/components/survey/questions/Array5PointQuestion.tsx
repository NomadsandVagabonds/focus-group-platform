// Array 5 Point Choice Question Component (LimeSurvey Type A)
// Matrix with subquestions as rows and fixed 1-5 scale columns
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface Array5PointQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function Array5PointQuestion({ question, responseData, onAnswer }: Array5PointQuestionProps) {
    const subquestions = question.subquestions.sort((a, b) => a.order_index - b.order_index);
    const settings = question.settings || {};

    // Fixed 1-5 scale
    const scalePoints = [1, 2, 3, 4, 5];
    const lowLabel = settings.scale_low_label || '1';
    const highLabel = settings.scale_high_label || '5';

    const handleSelect = (subquestionCode: string, value: number) => {
        onAnswer(question.code, value.toString(), subquestionCode);
    };

    return (
        <div className="array-5point-question">
            <div className="array-table">
                <table>
                    <thead>
                        <tr>
                            <th className="subquestion-header"></th>
                            {scalePoints.map((point, index) => (
                                <th key={point} className="scale-header">
                                    {index === 0 && lowLabel !== '1' ? lowLabel :
                                     index === 4 && highLabel !== '5' ? highLabel : point}
                                </th>
                            ))}
                            {settings.show_no_answer && (
                                <th className="scale-header na-header">N/A</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {subquestions.map(subq => {
                            const currentValue = responseData.get(`${question.code}_${subq.code}`);
                            return (
                                <tr key={subq.id}>
                                    <td className="subquestion-label">{subq.label}</td>
                                    {scalePoints.map(point => (
                                        <td key={point} className="scale-cell">
                                            <button
                                                type="button"
                                                className={`scale-btn ${currentValue === point.toString() ? 'selected' : ''}`}
                                                onClick={() => handleSelect(subq.code, point)}
                                                aria-pressed={currentValue === point.toString()}
                                            >
                                                {point}
                                            </button>
                                        </td>
                                    ))}
                                    {settings.show_no_answer && (
                                        <td className="scale-cell">
                                            <button
                                                type="button"
                                                className={`scale-btn na-btn ${currentValue === '' ? 'selected' : ''}`}
                                                onClick={() => onAnswer(question.code, '', subq.code)}
                                            >
                                                -
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .array-5point-question {
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
                    padding: 10px 8px;
                    border: 1px solid #ddd;
                    font-size: 0.875rem;
                }

                .subquestion-header {
                    background: #f8f8f8;
                    font-weight: 500;
                    text-align: left;
                    min-width: 200px;
                }

                .scale-header {
                    background: #f8f8f8;
                    font-weight: 500;
                    text-align: center;
                    min-width: 50px;
                    font-size: 0.8125rem;
                }

                .na-header {
                    color: #666;
                }

                .subquestion-label {
                    font-weight: normal;
                    color: #333;
                    text-align: left;
                }

                .scale-cell {
                    text-align: center;
                    background: #fff;
                    padding: 8px 4px;
                }

                .scale-btn {
                    width: 36px;
                    height: 36px;
                    border: 2px solid #ddd;
                    border-radius: 50%;
                    background: white;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #333;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .scale-btn:hover {
                    border-color: #c94a4a;
                    background: #faf5f5;
                }

                .scale-btn.selected {
                    border-color: #c94a4a;
                    background: #c94a4a;
                    color: white;
                }

                .scale-btn:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(201, 74, 74, 0.2);
                }

                .na-btn {
                    border-radius: 4px;
                    color: #666;
                }

                .na-btn.selected {
                    background: #e0ddd8;
                    border-color: #ccc;
                    color: #333;
                }

                @media (max-width: 768px) {
                    .array-table th,
                    .array-table td {
                        padding: 8px 4px;
                    }

                    .subquestion-header {
                        min-width: 150px;
                    }

                    .scale-header {
                        min-width: 40px;
                        font-size: 0.75rem;
                    }

                    .scale-btn {
                        width: 32px;
                        height: 32px;
                        font-size: 0.8rem;
                    }
                }

                @media (max-width: 480px) {
                    .array-5point-question {
                        margin: 0 -1rem;
                    }

                    .subquestion-header {
                        min-width: 120px;
                    }

                    .scale-btn {
                        width: 28px;
                        height: 28px;
                        font-size: 0.75rem;
                    }
                }
            `}</style>
        </div>
    );
}
