'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SurveyWithStructure } from '@/lib/supabase/survey-types';

interface CrossTabulationProps {
    surveyId: string;
}

interface ResponseData {
    id: string;
    question_id: string;
    subquestion_id?: string;
    value: string;
}

interface SurveyResponseWithData {
    id: string;
    status: string;
    response_data: ResponseData[];
}

interface Question {
    id: string;
    code: string;
    question_text: string;
    question_type: string;
    answer_options: { code: string; label: string; order_index: number }[];
}

interface CrossTabCell {
    count: number;
    rowPercent: number;
    colPercent: number;
    totalPercent: number;
}

interface CrossTabResult {
    rowQuestion: Question;
    colQuestion: Question;
    matrix: Map<string, Map<string, CrossTabCell>>;
    rowTotals: Map<string, number>;
    colTotals: Map<string, number>;
    grandTotal: number;
}

// Editorial Academic theme colors
const HEAT_COLORS = {
    low: '#f5f3ef',
    medium: '#e8c4c4',
    high: '#c94a4a',
};

function getHeatColor(percentage: number): string {
    if (percentage <= 10) return HEAT_COLORS.low;
    if (percentage <= 30) return `rgb(232, ${196 - Math.floor((percentage - 10) * 2)}, ${196 - Math.floor((percentage - 10) * 2)})`;
    return `rgb(${201 - Math.floor((percentage - 30) * 1.5)}, ${74 - Math.floor((percentage - 30) * 0.5)}, ${74 - Math.floor((percentage - 30) * 0.5)})`;
}

export default function CrossTabulation({ surveyId }: CrossTabulationProps) {
    const [survey, setSurvey] = useState<SurveyWithStructure | null>(null);
    const [responses, setResponses] = useState<SurveyResponseWithData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [rowQuestionId, setRowQuestionId] = useState<string>('');
    const [colQuestionId, setColQuestionId] = useState<string>('');
    const [showPercentages, setShowPercentages] = useState<'row' | 'col' | 'total' | 'none'>('row');
    const [showHeatmap, setShowHeatmap] = useState(true);

    // Get list of questions suitable for cross-tabulation
    const eligibleQuestions = useMemo(() => {
        if (!survey) return [];

        return survey.question_groups
            .flatMap(g => g.questions)
            .filter(q =>
                q.question_type === 'multiple_choice_single' ||
                q.question_type === 'yes_no' ||
                q.question_type === 'dropdown' ||
                q.question_type === 'five_point_choice' ||
                q.question_type === 'list_with_comment'
            )
            .map(q => ({
                id: q.id,
                code: q.code,
                question_text: q.question_text,
                question_type: q.question_type,
                answer_options: q.answer_options?.sort((a, b) => a.order_index - b.order_index) || []
            })) as Question[];
    }, [survey]);

    // Calculate cross-tabulation
    const crossTabResult = useMemo<CrossTabResult | null>(() => {
        if (!rowQuestionId || !colQuestionId || rowQuestionId === colQuestionId) return null;

        const rowQuestion = eligibleQuestions.find(q => q.id === rowQuestionId);
        const colQuestion = eligibleQuestions.find(q => q.id === colQuestionId);

        if (!rowQuestion || !colQuestion) return null;

        // Get answer options or generate them for yes_no
        const getOptions = (q: Question) => {
            if (q.question_type === 'yes_no') {
                return [
                    { code: 'Y', label: 'Yes', order_index: 0 },
                    { code: 'N', label: 'No', order_index: 1 }
                ];
            }
            return q.answer_options || [];
        };

        const rowOptions = getOptions(rowQuestion);
        const colOptions = getOptions(colQuestion);

        // Initialize matrix
        const matrix = new Map<string, Map<string, CrossTabCell>>();
        const rowTotals = new Map<string, number>();
        const colTotals = new Map<string, number>();

        // Initialize all cells to 0
        for (const rowOpt of rowOptions) {
            const rowMap = new Map<string, CrossTabCell>();
            for (const colOpt of colOptions) {
                rowMap.set(colOpt.code, { count: 0, rowPercent: 0, colPercent: 0, totalPercent: 0 });
            }
            matrix.set(rowOpt.code, rowMap);
            rowTotals.set(rowOpt.code, 0);
        }
        for (const colOpt of colOptions) {
            colTotals.set(colOpt.code, 0);
        }

        // Count responses
        let grandTotal = 0;
        for (const response of responses) {
            if (response.status !== 'complete') continue;

            const rowValue = response.response_data?.find(rd => rd.question_id === rowQuestionId && !rd.subquestion_id)?.value;
            const colValue = response.response_data?.find(rd => rd.question_id === colQuestionId && !rd.subquestion_id)?.value;

            if (rowValue && colValue) {
                const rowMap = matrix.get(rowValue);
                if (rowMap) {
                    const cell = rowMap.get(colValue);
                    if (cell) {
                        cell.count++;
                        rowTotals.set(rowValue, (rowTotals.get(rowValue) || 0) + 1);
                        colTotals.set(colValue, (colTotals.get(colValue) || 0) + 1);
                        grandTotal++;
                    }
                }
            }
        }

        // Calculate percentages
        for (const [rowCode, rowMap] of matrix) {
            for (const [colCode, cell] of rowMap) {
                const rowTotal = rowTotals.get(rowCode) || 0;
                const colTotal = colTotals.get(colCode) || 0;

                cell.rowPercent = rowTotal > 0 ? Math.round((cell.count / rowTotal) * 100) : 0;
                cell.colPercent = colTotal > 0 ? Math.round((cell.count / colTotal) * 100) : 0;
                cell.totalPercent = grandTotal > 0 ? Math.round((cell.count / grandTotal) * 100) : 0;
            }
        }

        return {
            rowQuestion: { ...rowQuestion, answer_options: rowOptions },
            colQuestion: { ...colQuestion, answer_options: colOptions },
            matrix,
            rowTotals,
            colTotals,
            grandTotal
        };
    }, [rowQuestionId, colQuestionId, eligibleQuestions, responses]);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                const [surveyRes, responsesRes] = await Promise.all([
                    fetch(`/api/survey/surveys/${surveyId}`),
                    fetch(`/api/survey/responses/${surveyId}`)
                ]);

                if (!surveyRes.ok || !responsesRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const surveyData = await surveyRes.json();
                const responsesData = await responsesRes.json();

                setSurvey(surveyData.data);
                setResponses(responsesData.responses || responsesData.data?.responses || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [surveyId]);

    // Auto-select first two questions when available
    useEffect(() => {
        if (eligibleQuestions.length >= 2 && !rowQuestionId && !colQuestionId) {
            setRowQuestionId(eligibleQuestions[0].id);
            setColQuestionId(eligibleQuestions[1].id);
        }
    }, [eligibleQuestions, rowQuestionId, colQuestionId]);

    if (loading) {
        return (
            <div className="crosstab-loading">
                <div className="loading-spinner" />
                <p>Loading cross-tabulation...</p>
                <style jsx>{`
                    .crosstab-loading {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 4rem;
                        color: #1a1d24;
                    }
                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid #e0ddd8;
                        border-top-color: #c94a4a;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 1rem;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="crosstab-error">
                <p>Error: {error}</p>
                <style jsx>{`
                    .crosstab-error {
                        padding: 2rem;
                        background: #fff5f5;
                        border: 1px solid #c94a4a;
                        border-radius: 8px;
                        color: #c94a4a;
                        text-align: center;
                    }
                `}</style>
            </div>
        );
    }

    if (eligibleQuestions.length < 2) {
        return (
            <div className="crosstab-empty">
                <p>Cross-tabulation requires at least 2 single-choice questions.</p>
                <p className="hint">Supported question types: Multiple Choice (Single), Yes/No, Dropdown, 5-Point Choice</p>
                <style jsx>{`
                    .crosstab-empty {
                        padding: 3rem;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                        text-align: center;
                        color: #666;
                    }
                    .hint {
                        font-size: 0.875rem;
                        margin-top: 0.5rem;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="cross-tabulation">
            <div className="crosstab-header">
                <h2>Cross-Tabulation Analysis</h2>
                <p className="subtitle">Compare responses between two questions</p>
            </div>

            <div className="question-selectors">
                <div className="selector-group">
                    <label>Row Question (Y-axis):</label>
                    <select
                        value={rowQuestionId}
                        onChange={(e) => setRowQuestionId(e.target.value)}
                    >
                        <option value="">Select a question...</option>
                        {eligibleQuestions.map(q => (
                            <option key={q.id} value={q.id} disabled={q.id === colQuestionId}>
                                [{q.code}] {q.question_text.substring(0, 60)}...
                            </option>
                        ))}
                    </select>
                </div>

                <div className="selector-group">
                    <label>Column Question (X-axis):</label>
                    <select
                        value={colQuestionId}
                        onChange={(e) => setColQuestionId(e.target.value)}
                    >
                        <option value="">Select a question...</option>
                        {eligibleQuestions.map(q => (
                            <option key={q.id} value={q.id} disabled={q.id === rowQuestionId}>
                                [{q.code}] {q.question_text.substring(0, 60)}...
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="display-options">
                <div className="option-group">
                    <label>Show percentages:</label>
                    <div className="button-group">
                        {(['none', 'row', 'col', 'total'] as const).map(opt => (
                            <button
                                key={opt}
                                className={showPercentages === opt ? 'active' : ''}
                                onClick={() => setShowPercentages(opt)}
                            >
                                {opt === 'none' ? 'Count only' : opt === 'row' ? 'Row %' : opt === 'col' ? 'Column %' : 'Total %'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="option-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={showHeatmap}
                            onChange={(e) => setShowHeatmap(e.target.checked)}
                        />
                        Show heatmap
                    </label>
                </div>
            </div>

            {crossTabResult && (
                <div className="crosstab-table-container">
                    <table className="crosstab-table">
                        <thead>
                            <tr>
                                <th className="corner-cell">
                                    <div className="corner-labels">
                                        <span className="row-label">{crossTabResult.rowQuestion.code}</span>
                                        <span className="col-label">{crossTabResult.colQuestion.code}</span>
                                    </div>
                                </th>
                                {crossTabResult.colQuestion.answer_options.map(colOpt => (
                                    <th key={colOpt.code} className="col-header">
                                        {colOpt.label}
                                    </th>
                                ))}
                                <th className="total-header">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {crossTabResult.rowQuestion.answer_options.map(rowOpt => (
                                <tr key={rowOpt.code}>
                                    <th className="row-header">{rowOpt.label}</th>
                                    {crossTabResult.colQuestion.answer_options.map(colOpt => {
                                        const cell = crossTabResult.matrix.get(rowOpt.code)?.get(colOpt.code);
                                        if (!cell) return <td key={colOpt.code}>-</td>;

                                        const percentage = showPercentages === 'row' ? cell.rowPercent
                                            : showPercentages === 'col' ? cell.colPercent
                                            : showPercentages === 'total' ? cell.totalPercent : 0;

                                        return (
                                            <td
                                                key={colOpt.code}
                                                className="data-cell"
                                                style={showHeatmap && showPercentages !== 'none' ? {
                                                    backgroundColor: getHeatColor(percentage)
                                                } : undefined}
                                            >
                                                <span className="cell-count">{cell.count}</span>
                                                {showPercentages !== 'none' && (
                                                    <span className="cell-percent">({percentage}%)</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="total-cell">
                                        <span className="cell-count">{crossTabResult.rowTotals.get(rowOpt.code) || 0}</span>
                                    </td>
                                </tr>
                            ))}
                            <tr className="total-row">
                                <th className="row-header">Total</th>
                                {crossTabResult.colQuestion.answer_options.map(colOpt => (
                                    <td key={colOpt.code} className="total-cell">
                                        <span className="cell-count">{crossTabResult.colTotals.get(colOpt.code) || 0}</span>
                                    </td>
                                ))}
                                <td className="grand-total">
                                    <span className="cell-count">{crossTabResult.grandTotal}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {crossTabResult && crossTabResult.grandTotal === 0 && (
                <div className="no-data">
                    <p>No responses match both selected questions.</p>
                </div>
            )}

            <style jsx>{`
                .cross-tabulation {
                    padding: 2rem;
                    background: #f5f3ef;
                    font-family: 'Libre Baskerville', Georgia, serif;
                }

                .crosstab-header {
                    margin-bottom: 2rem;
                }

                .crosstab-header h2 {
                    color: #1a1d24;
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                }

                .subtitle {
                    color: #666;
                    font-size: 0.9rem;
                }

                .question-selectors {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .selector-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .selector-group label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1a1d24;
                }

                .selector-group select {
                    padding: 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-family: inherit;
                    background: white;
                    cursor: pointer;
                }

                .selector-group select:focus {
                    outline: none;
                    border-color: #c94a4a;
                }

                .display-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 2rem;
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }

                .option-group {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .option-group > label {
                    font-size: 0.875rem;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .option-group input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    accent-color: #c94a4a;
                }

                .button-group {
                    display: flex;
                    gap: 0.25rem;
                }

                .button-group button {
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #e0ddd8;
                    background: white;
                    font-size: 0.8rem;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #666;
                }

                .button-group button:first-child {
                    border-radius: 4px 0 0 4px;
                }

                .button-group button:last-child {
                    border-radius: 0 4px 4px 0;
                }

                .button-group button:not(:last-child) {
                    border-right: none;
                }

                .button-group button:hover {
                    background: #f5f3ef;
                }

                .button-group button.active {
                    background: #c94a4a;
                    border-color: #c94a4a;
                    color: white;
                }

                .crosstab-table-container {
                    overflow-x: auto;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }

                .crosstab-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }

                .crosstab-table th,
                .crosstab-table td {
                    padding: 0.75rem 1rem;
                    border: 1px solid #e0ddd8;
                    text-align: center;
                }

                .corner-cell {
                    background: #f5f3ef;
                    position: relative;
                    min-width: 100px;
                }

                .corner-labels {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-size: 0.75rem;
                    color: #666;
                }

                .row-label::after {
                    content: ' (rows)';
                }

                .col-label::after {
                    content: ' (cols)';
                }

                .col-header {
                    background: #f5f3ef;
                    font-weight: 500;
                    color: #1a1d24;
                    max-width: 150px;
                    word-wrap: break-word;
                }

                .row-header {
                    background: #f5f3ef;
                    font-weight: 500;
                    color: #1a1d24;
                    text-align: left;
                    max-width: 200px;
                    word-wrap: break-word;
                }

                .data-cell {
                    transition: background-color 0.2s;
                }

                .cell-count {
                    font-weight: 600;
                    color: #1a1d24;
                }

                .cell-percent {
                    display: block;
                    font-size: 0.75rem;
                    color: #666;
                    margin-top: 0.25rem;
                }

                .total-header,
                .total-cell {
                    background: #fafaf8;
                    font-weight: 500;
                }

                .total-row th,
                .total-row td {
                    background: #fafaf8;
                    font-weight: 500;
                }

                .grand-total {
                    background: #f0eeea !important;
                    font-weight: 600;
                }

                .no-data {
                    padding: 2rem;
                    text-align: center;
                    color: #666;
                    background: white;
                    border-radius: 8px;
                    margin-top: 1rem;
                }
            `}</style>
        </div>
    );
}
