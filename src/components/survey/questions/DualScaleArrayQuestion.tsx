// Dual Scale Array Question Component (LimeSurvey Type 1)
// Two independent rating scales per row - common for importance vs. satisfaction surveys
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface DualScaleArrayQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function DualScaleArrayQuestion({ question, responseData, onAnswer }: DualScaleArrayQuestionProps) {
    const subquestions = question.subquestions.sort((a, b) => a.order_index - b.order_index);

    // Split answer options by scale_id (0 = first scale, 1 = second scale)
    const scale1Options = question.answer_options
        .filter(opt => opt.scale_id === 0 || opt.scale_id === null)
        .sort((a, b) => a.order_index - b.order_index);
    const scale2Options = question.answer_options
        .filter(opt => opt.scale_id === 1)
        .sort((a, b) => a.order_index - b.order_index);

    const settings = question.settings || {};
    const scale1Header = settings.scale1_header || 'Scale 1';
    const scale2Header = settings.scale2_header || 'Scale 2';
    const showNoAnswer = settings.show_no_answer !== false;

    return (
        <div className="dual-scale-question">
            <div className="table-wrapper">
                <table>
                    <thead>
                        {/* Scale group headers */}
                        <tr className="scale-headers">
                            <th className="subquestion-header"></th>
                            <th colSpan={scale1Options.length} className="scale-group-header scale-1">
                                {scale1Header}
                            </th>
                            {scale2Options.length > 0 && (
                                <>
                                    <th className="separator-header"></th>
                                    <th colSpan={scale2Options.length} className="scale-group-header scale-2">
                                        {scale2Header}
                                    </th>
                                </>
                            )}
                            {showNoAnswer && <th className="no-answer-header"></th>}
                        </tr>
                        {/* Individual option headers */}
                        <tr className="option-headers">
                            <th className="subquestion-header"></th>
                            {scale1Options.map(option => (
                                <th key={`s1-${option.id}`} className="answer-header">
                                    {option.label}
                                </th>
                            ))}
                            {scale2Options.length > 0 && (
                                <>
                                    <th className="separator-cell"></th>
                                    {scale2Options.map(option => (
                                        <th key={`s2-${option.id}`} className="answer-header">
                                            {option.label}
                                        </th>
                                    ))}
                                </>
                            )}
                            {showNoAnswer && <th className="answer-header no-answer">N/A</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {subquestions.map((subq, rowIndex) => {
                            const scale1Value = responseData.get(`${question.code}_${subq.code}_scale1`);
                            const scale2Value = responseData.get(`${question.code}_${subq.code}_scale2`);

                            return (
                                <tr key={subq.id} className={rowIndex % 2 === 0 ? 'row-even' : 'row-odd'}>
                                    <td className="subquestion-label">{subq.label}</td>

                                    {/* Scale 1 options */}
                                    {scale1Options.map(option => (
                                        <td key={`s1-${option.id}`} className="answer-cell scale-1">
                                            <input
                                                type="radio"
                                                name={`${question.code}_${subq.code}_scale1`}
                                                value={option.code}
                                                checked={scale1Value === option.code}
                                                onChange={() => onAnswer(question.code, option.code, `${subq.code}_scale1`)}
                                                aria-label={`${subq.label} - ${scale1Header}: ${option.label}`}
                                            />
                                        </td>
                                    ))}

                                    {/* Separator and Scale 2 options */}
                                    {scale2Options.length > 0 && (
                                        <>
                                            <td className="separator-cell"></td>
                                            {scale2Options.map(option => (
                                                <td key={`s2-${option.id}`} className="answer-cell scale-2">
                                                    <input
                                                        type="radio"
                                                        name={`${question.code}_${subq.code}_scale2`}
                                                        value={option.code}
                                                        checked={scale2Value === option.code}
                                                        onChange={() => onAnswer(question.code, option.code, `${subq.code}_scale2`)}
                                                        aria-label={`${subq.label} - ${scale2Header}: ${option.label}`}
                                                    />
                                                </td>
                                            ))}
                                        </>
                                    )}

                                    {/* No answer option */}
                                    {showNoAnswer && (
                                        <td className="answer-cell no-answer-cell">
                                            <input
                                                type="radio"
                                                name={`${question.code}_${subq.code}_scale2`}
                                                value=""
                                                checked={scale2Value === ''}
                                                onChange={() => onAnswer(question.code, '', `${subq.code}_scale2`)}
                                                aria-label={`${subq.label} - No answer`}
                                            />
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .dual-scale-question {
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
                    padding: 10px 8px;
                    border: 1px solid #ddd;
                    font-size: 0.875rem;
                }

                .scale-headers th {
                    background: #f0f0f0;
                    font-weight: 600;
                    text-align: center;
                    border-bottom: 2px solid #ccc;
                }

                .scale-group-header {
                    font-size: 0.9rem;
                    color: #333;
                }

                .scale-group-header.scale-1 {
                    background: #e8f4e8;
                }

                .scale-group-header.scale-2 {
                    background: #e8e8f4;
                }

                .option-headers th {
                    background: #f8f8f8;
                    font-weight: 500;
                    text-align: center;
                    min-width: 60px;
                    font-size: 0.8rem;
                    color: #555;
                }

                .subquestion-header {
                    width: 200px;
                    background: #f8f8f8;
                }

                .subquestion-label {
                    font-weight: normal;
                    color: #333;
                    text-align: left;
                    background: white;
                }

                .answer-cell {
                    text-align: center;
                    background: #fff;
                }

                .answer-cell.scale-1 {
                    background: #fafff9;
                }

                .answer-cell.scale-2 {
                    background: #f9f9ff;
                }

                .separator-cell, .separator-header {
                    width: 20px;
                    background: #eee;
                    border-left: 2px solid #ccc;
                    border-right: 2px solid #ccc;
                }

                .no-answer-header, .no-answer-cell {
                    background: #f5f5f5;
                    min-width: 50px;
                }

                input[type="radio"] {
                    cursor: pointer;
                    width: 18px;
                    height: 18px;
                    margin: 0;
                    accent-color: #c94a4a;
                }

                .row-even td {
                    background-color: inherit;
                }

                .row-odd td.subquestion-label {
                    background: #fafafa;
                }

                @media (max-width: 1024px) {
                    th, td {
                        padding: 8px 6px;
                        font-size: 0.8rem;
                    }

                    .option-headers th {
                        min-width: 50px;
                        font-size: 0.75rem;
                    }

                    .subquestion-header {
                        width: 150px;
                    }
                }

                @media (max-width: 768px) {
                    .dual-scale-question {
                        margin: 0 -1rem;
                    }

                    th, td {
                        padding: 6px 4px;
                        font-size: 0.75rem;
                    }

                    .option-headers th {
                        min-width: 40px;
                        font-size: 0.7rem;
                    }

                    .subquestion-header {
                        width: 120px;
                    }

                    input[type="radio"] {
                        width: 16px;
                        height: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
