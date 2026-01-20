// Yes/No/Uncertain Array Question Component (LimeSurvey Type C)
// Each row has three predefined options: Yes, No, Uncertain
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface YesNoUncertainArrayQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

const DEFAULT_OPTIONS = [
    { code: 'Y', label: 'Yes' },
    { code: 'N', label: 'No' },
    { code: 'U', label: 'Uncertain' },
];

export default function YesNoUncertainArrayQuestion({ question, responseData, onAnswer }: YesNoUncertainArrayQuestionProps) {
    const subquestions = question.subquestions.sort((a, b) => a.order_index - b.order_index);
    const settings = question.settings || {};

    // Use custom labels if provided, otherwise defaults
    const options = question.answer_options.length > 0
        ? question.answer_options.sort((a, b) => a.order_index - b.order_index).map(opt => ({ code: opt.code, label: opt.label }))
        : DEFAULT_OPTIONS;

    const showNoAnswer = settings.show_no_answer !== false;

    return (
        <div className="ynu-question">
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th className="subquestion-header"></th>
                            {options.map(option => (
                                <th key={option.code} className="answer-header">
                                    {option.label}
                                </th>
                            ))}
                            {showNoAnswer && <th className="answer-header na-header">N/A</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {subquestions.map((subq, rowIndex) => {
                            const currentValue = responseData.get(`${question.code}_${subq.code}`);

                            return (
                                <tr key={subq.id} className={rowIndex % 2 === 0 ? 'row-even' : 'row-odd'}>
                                    <td className="subquestion-label">{subq.label}</td>
                                    {options.map(option => (
                                        <td key={option.code} className="answer-cell">
                                            <label className="radio-label">
                                                <input
                                                    type="radio"
                                                    name={`${question.code}_${subq.code}`}
                                                    value={option.code}
                                                    checked={currentValue === option.code}
                                                    onChange={() => onAnswer(question.code, option.code, subq.code)}
                                                    aria-label={`${subq.label}: ${option.label}`}
                                                />
                                                <span className="radio-custom"></span>
                                            </label>
                                        </td>
                                    ))}
                                    {showNoAnswer && (
                                        <td className="answer-cell na-cell">
                                            <label className="radio-label">
                                                <input
                                                    type="radio"
                                                    name={`${question.code}_${subq.code}`}
                                                    value=""
                                                    checked={currentValue === ''}
                                                    onChange={() => onAnswer(question.code, '', subq.code)}
                                                    aria-label={`${subq.label}: No answer`}
                                                />
                                                <span className="radio-custom"></span>
                                            </label>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .ynu-question {
                    overflow-x: auto;
                    margin: 1rem 0;
                }

                .table-wrapper {
                    min-width: 100%;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border: 1px solid #ddd;
                }

                th, td {
                    padding: 12px 16px;
                    border: 1px solid #ddd;
                    font-size: 0.875rem;
                }

                .subquestion-header {
                    width: 50%;
                    background: #f8f8f8;
                    text-align: left;
                }

                .answer-header {
                    background: #f8f8f8;
                    font-weight: 600;
                    text-align: center;
                    min-width: 100px;
                    font-size: 0.875rem;
                    color: #333;
                }

                .na-header {
                    background: #f5f5f5;
                    color: #666;
                    min-width: 70px;
                }

                .subquestion-label {
                    font-weight: normal;
                    color: #333;
                    text-align: left;
                }

                .answer-cell {
                    text-align: center;
                    background: #fff;
                }

                .na-cell {
                    background: #fafafa;
                }

                .radio-label {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    padding: 4px;
                }

                .radio-label input[type="radio"] {
                    cursor: pointer;
                    width: 20px;
                    height: 20px;
                    margin: 0;
                    accent-color: #c94a4a;
                }

                .row-odd .subquestion-label {
                    background: #fafafa;
                }

                @media (max-width: 768px) {
                    .ynu-question {
                        margin: 0 -0.5rem;
                    }

                    th, td {
                        padding: 10px 8px;
                        font-size: 0.8rem;
                    }

                    .answer-header {
                        min-width: 70px;
                        font-size: 0.8rem;
                    }

                    .radio-label input[type="radio"] {
                        width: 18px;
                        height: 18px;
                    }
                }

                @media (max-width: 480px) {
                    th, td {
                        padding: 8px 6px;
                        font-size: 0.75rem;
                    }

                    .answer-header {
                        min-width: 50px;
                        font-size: 0.7rem;
                    }

                    .na-header {
                        min-width: 40px;
                    }

                    .radio-label input[type="radio"] {
                        width: 16px;
                        height: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
