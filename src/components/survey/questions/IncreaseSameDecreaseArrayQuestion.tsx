// Increase/Same/Decrease Array Question Component (LimeSurvey Type E)
// Each row has three predefined options: Increase, Same, Decrease
// Common for trend/change perception questions
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface IncreaseSameDecreaseArrayQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

const DEFAULT_OPTIONS = [
    { code: 'I', label: 'Increase', icon: '↑' },
    { code: 'S', label: 'Same', icon: '→' },
    { code: 'D', label: 'Decrease', icon: '↓' },
];

export default function IncreaseSameDecreaseArrayQuestion({ question, responseData, onAnswer }: IncreaseSameDecreaseArrayQuestionProps) {
    const subquestions = question.subquestions.sort((a, b) => a.order_index - b.order_index);
    const settings = question.settings || {};

    // Use custom labels if provided, otherwise defaults
    const options = question.answer_options.length > 0
        ? question.answer_options.sort((a, b) => a.order_index - b.order_index).map(opt => ({
            code: opt.code,
            label: opt.label,
            icon: opt.code === 'I' ? '↑' : opt.code === 'D' ? '↓' : '→'
        }))
        : DEFAULT_OPTIONS;

    const showNoAnswer = settings.show_no_answer !== false;
    const showIcons = settings.show_icons !== false;

    return (
        <div className="isd-question">
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th className="subquestion-header"></th>
                            {options.map(option => (
                                <th key={option.code} className={`answer-header option-${option.code.toLowerCase()}`}>
                                    {showIcons && <span className="option-icon">{option.icon}</span>}
                                    <span className="option-label">{option.label}</span>
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
                                    {options.map(option => {
                                        const isSelected = currentValue === option.code;
                                        return (
                                            <td key={option.code} className={`answer-cell option-${option.code.toLowerCase()}`}>
                                                <button
                                                    type="button"
                                                    className={`option-button ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => onAnswer(question.code, option.code, subq.code)}
                                                    aria-label={`${subq.label}: ${option.label}`}
                                                    aria-pressed={isSelected}
                                                >
                                                    {showIcons && <span className="btn-icon">{option.icon}</span>}
                                                </button>
                                            </td>
                                        );
                                    })}
                                    {showNoAnswer && (
                                        <td className="answer-cell na-cell">
                                            <button
                                                type="button"
                                                className={`option-button na-button ${currentValue === '' ? 'selected' : ''}`}
                                                onClick={() => onAnswer(question.code, '', subq.code)}
                                                aria-label={`${subq.label}: No answer`}
                                                aria-pressed={currentValue === ''}
                                            >
                                                —
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
                .isd-question {
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

                .answer-header.option-i {
                    background: #e8f5e9;
                }

                .answer-header.option-s {
                    background: #fff8e1;
                }

                .answer-header.option-d {
                    background: #ffebee;
                }

                .option-icon {
                    display: block;
                    font-size: 1.1rem;
                    margin-bottom: 2px;
                }

                .option-label {
                    font-size: 0.8rem;
                }

                .na-header {
                    background: #f5f5f5;
                    color: #666;
                    min-width: 60px;
                }

                .subquestion-label {
                    font-weight: normal;
                    color: #333;
                    text-align: left;
                }

                .answer-cell {
                    text-align: center;
                    background: #fff;
                    padding: 8px;
                }

                .option-button {
                    width: 44px;
                    height: 44px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    font-size: 1.2rem;
                    transition: all 0.15s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .option-button:hover {
                    transform: scale(1.05);
                }

                .answer-cell.option-i .option-button:hover {
                    border-color: #4caf50;
                    background: #e8f5e9;
                    color: #2e7d32;
                }

                .answer-cell.option-s .option-button:hover {
                    border-color: #ff9800;
                    background: #fff8e1;
                    color: #ef6c00;
                }

                .answer-cell.option-d .option-button:hover {
                    border-color: #f44336;
                    background: #ffebee;
                    color: #c62828;
                }

                .answer-cell.option-i .option-button.selected {
                    background: #4caf50;
                    border-color: #4caf50;
                    color: white;
                }

                .answer-cell.option-s .option-button.selected {
                    background: #ff9800;
                    border-color: #ff9800;
                    color: white;
                }

                .answer-cell.option-d .option-button.selected {
                    background: #f44336;
                    border-color: #f44336;
                    color: white;
                }

                .na-button {
                    width: 36px;
                    height: 36px;
                    font-size: 0.9rem;
                    color: #999;
                }

                .na-button:hover {
                    border-color: #999;
                    background: #f5f5f5;
                }

                .na-button.selected {
                    background: #666;
                    border-color: #666;
                    color: white;
                }

                .option-button:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
                }

                .row-odd .subquestion-label {
                    background: #fafafa;
                }

                @media (max-width: 768px) {
                    .isd-question {
                        margin: 0 -0.5rem;
                    }

                    th, td {
                        padding: 10px 8px;
                        font-size: 0.8rem;
                    }

                    .answer-header {
                        min-width: 70px;
                    }

                    .option-button {
                        width: 38px;
                        height: 38px;
                        font-size: 1rem;
                    }

                    .na-button {
                        width: 32px;
                        height: 32px;
                    }
                }

                @media (max-width: 480px) {
                    th, td {
                        padding: 8px 6px;
                        font-size: 0.75rem;
                    }

                    .answer-header {
                        min-width: 55px;
                    }

                    .option-icon {
                        display: none;
                    }

                    .option-button {
                        width: 32px;
                        height: 32px;
                        font-size: 0.9rem;
                    }

                    .na-button {
                        width: 28px;
                        height: 28px;
                    }
                }
            `}</style>
        </div>
    );
}
