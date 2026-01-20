// 10-Point Choice Array Question Component (LimeSurvey Type B)
// Each row has a 1-10 scale with visual button-style selection
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface TenPointArrayQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function TenPointArrayQuestion({ question, responseData, onAnswer }: TenPointArrayQuestionProps) {
    const subquestions = question.subquestions.sort((a, b) => a.order_index - b.order_index);
    const settings = question.settings || {};

    // Generate 1-10 scale
    const scalePoints = Array.from({ length: 10 }, (_, i) => i + 1);

    const showNoAnswer = settings.show_no_answer !== false;
    const lowLabel = settings.scale_low_label || '';
    const highLabel = settings.scale_high_label || '';

    return (
        <div className="ten-point-question">
            {/* Scale labels */}
            {(lowLabel || highLabel) && (
                <div className="scale-labels">
                    <span className="scale-label-placeholder"></span>
                    <span className="scale-label low">{lowLabel}</span>
                    <span className="scale-label high">{highLabel}</span>
                    {showNoAnswer && <span className="scale-label na"></span>}
                </div>
            )}

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th className="subquestion-header"></th>
                            {scalePoints.map(point => (
                                <th key={point} className="point-header">
                                    {point}
                                </th>
                            ))}
                            {showNoAnswer && <th className="na-header">N/A</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {subquestions.map((subq, rowIndex) => {
                            const currentValue = responseData.get(`${question.code}_${subq.code}`);

                            return (
                                <tr key={subq.id} className={rowIndex % 2 === 0 ? 'row-even' : 'row-odd'}>
                                    <td className="subquestion-label">{subq.label}</td>
                                    {scalePoints.map(point => {
                                        const isSelected = currentValue === point.toString();
                                        return (
                                            <td key={point} className="point-cell">
                                                <button
                                                    type="button"
                                                    className={`point-button ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => onAnswer(question.code, point.toString(), subq.code)}
                                                    aria-label={`${subq.label}: ${point}`}
                                                    aria-pressed={isSelected}
                                                >
                                                    {point}
                                                </button>
                                            </td>
                                        );
                                    })}
                                    {showNoAnswer && (
                                        <td className="na-cell">
                                            <button
                                                type="button"
                                                className={`point-button na-button ${currentValue === '' ? 'selected' : ''}`}
                                                onClick={() => onAnswer(question.code, '', subq.code)}
                                                aria-label={`${subq.label}: No answer`}
                                                aria-pressed={currentValue === ''}
                                            >
                                                N/A
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
                .ten-point-question {
                    overflow-x: auto;
                    margin: 1rem 0;
                }

                .scale-labels {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    padding: 0 8px;
                    font-size: 0.8rem;
                    color: #666;
                }

                .scale-label-placeholder {
                    width: 200px;
                    flex-shrink: 0;
                }

                .scale-label {
                    flex: 1;
                    font-style: italic;
                }

                .scale-label.low {
                    text-align: left;
                }

                .scale-label.high {
                    text-align: right;
                }

                .scale-label.na {
                    width: 50px;
                    flex: none;
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
                    padding: 8px 4px;
                    border: 1px solid #ddd;
                    font-size: 0.875rem;
                }

                .subquestion-header {
                    width: 200px;
                    background: #f8f8f8;
                }

                .point-header {
                    background: #f8f8f8;
                    font-weight: 600;
                    text-align: center;
                    min-width: 40px;
                    font-size: 0.85rem;
                    color: #333;
                }

                .na-header {
                    background: #f5f5f5;
                    font-weight: 500;
                    text-align: center;
                    min-width: 50px;
                    color: #666;
                }

                .subquestion-label {
                    font-weight: normal;
                    color: #333;
                    text-align: left;
                    padding: 12px 10px;
                }

                .point-cell, .na-cell {
                    text-align: center;
                    padding: 6px 2px;
                }

                .point-button {
                    width: 32px;
                    height: 32px;
                    border: 2px solid #ddd;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #666;
                    transition: all 0.15s ease;
                }

                .point-button:hover {
                    border-color: #c94a4a;
                    color: #c94a4a;
                    background: #fff5f5;
                }

                .point-button.selected {
                    background: #c94a4a;
                    border-color: #c94a4a;
                    color: white;
                }

                .point-button:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.2);
                }

                .na-button {
                    width: auto;
                    padding: 0 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                }

                .row-odd .subquestion-label {
                    background: #fafafa;
                }

                @media (max-width: 1024px) {
                    .scale-label-placeholder {
                        width: 150px;
                    }

                    .subquestion-header {
                        width: 150px;
                    }

                    .point-button {
                        width: 28px;
                        height: 28px;
                        font-size: 0.75rem;
                    }

                    th, td {
                        padding: 6px 3px;
                        font-size: 0.8rem;
                    }
                }

                @media (max-width: 768px) {
                    .ten-point-question {
                        margin: 0 -1rem;
                    }

                    .scale-labels {
                        display: none;
                    }

                    .scale-label-placeholder,
                    .subquestion-header {
                        width: 100px;
                    }

                    .point-button {
                        width: 24px;
                        height: 24px;
                        font-size: 0.7rem;
                        border-width: 1px;
                    }

                    th, td {
                        padding: 4px 2px;
                        font-size: 0.7rem;
                    }

                    .point-header {
                        min-width: 28px;
                    }
                }
            `}</style>
        </div>
    );
}
