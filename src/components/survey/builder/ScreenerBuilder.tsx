// Visual Screener Builder - Intuitive UI for setting up screenout conditions
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface ScreenerBuilderProps {
    question: Question & { subquestions?: Subquestion[]; answer_options?: AnswerOption[] };
    allQuestions: Array<Question & { subquestions?: Subquestion[]; answer_options?: AnswerOption[] }>;
    value: string; // Current screenout_condition expression
    onChange: (expression: string) => void;
}

interface ScreenerRule {
    questionCode: string;
    subquestionCode?: string; // For array/matrix questions
    operator: 'equals' | 'not_equals' | 'in' | 'not_in';
    values: string[]; // Answer option codes that trigger screenout
}

export default function ScreenerBuilder({
    question,
    allQuestions,
    value,
    onChange,
}: ScreenerBuilderProps) {
    const [mode, setMode] = useState<'visual' | 'code'>('visual');
    const [screenoutType, setScreenoutType] = useState<'screenout_if' | 'pass_if'>('screenout_if');

    // Parse existing expression to extract rule (simplified parsing)
    const [selectedQuestion, setSelectedQuestion] = useState<string>(question.code);
    const [selectedSubquestion, setSelectedSubquestion] = useState<string>('');
    const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());

    // Get questions that come before this one (can only screen based on previous answers)
    const availableQuestions = useMemo(() => {
        const thisIndex = allQuestions.findIndex(q => q.id === question.id);
        return allQuestions.slice(0, thisIndex + 1).filter(q =>
            // Only include questions with answer options or subquestions
            (q.answer_options && q.answer_options.length > 0) ||
            (q.subquestions && q.subquestions.length > 0)
        );
    }, [allQuestions, question.id]);

    // Get the selected question object
    const targetQuestion = useMemo(() => {
        return availableQuestions.find(q => q.code === selectedQuestion);
    }, [availableQuestions, selectedQuestion]);

    // Determine if target question is an array/matrix type
    const isArrayQuestion = useMemo(() => {
        if (!targetQuestion) return false;
        const type = targetQuestion.question_type;
        return ['F', 'H', 'array', 'array_flexible', ';', ':'].includes(type || '');
    }, [targetQuestion]);

    // Get answer options (columns for array questions)
    const answerOptions = useMemo(() => {
        if (!targetQuestion) return [];
        return (targetQuestion.answer_options || []).sort((a, b) => a.order_index - b.order_index);
    }, [targetQuestion]);

    // Get subquestions (rows for array questions)
    const subquestions = useMemo(() => {
        if (!targetQuestion) return [];
        return (targetQuestion.subquestions || []).sort((a, b) => a.order_index - b.order_index);
    }, [targetQuestion]);

    // Generate expression from visual selection
    const generateExpression = () => {
        if (selectedValues.size === 0) return '';

        const questionRef = selectedSubquestion
            ? `${selectedQuestion}_${selectedSubquestion}`
            : selectedQuestion;

        const valueArray = Array.from(selectedValues);

        if (screenoutType === 'screenout_if') {
            // Screen out if any of these values match
            const conditions = valueArray.map(v => `${questionRef} == '${v}'`);
            return conditions.length === 1 ? conditions[0] : `(${conditions.join(' || ')})`;
        } else {
            // Screen out if NOT any of these values (pass_if)
            const conditions = valueArray.map(v => `${questionRef} == '${v}'`);
            return conditions.length === 1
                ? `${questionRef} != '${valueArray[0]}'`
                : `!(${conditions.join(' || ')})`;
        }
    };

    // Update expression when selections change
    useEffect(() => {
        if (mode === 'visual') {
            const expr = generateExpression();
            onChange(expr);
        }
    }, [selectedQuestion, selectedSubquestion, selectedValues, screenoutType, mode]);

    const toggleValue = (code: string) => {
        const newValues = new Set(selectedValues);
        if (newValues.has(code)) {
            newValues.delete(code);
        } else {
            newValues.add(code);
        }
        setSelectedValues(newValues);
    };

    return (
        <div className="screener-builder">
            <div className="builder-header">
                <h3>
                    <span className="icon">🚫</span>
                    Screener Setup
                </h3>
                <div className="mode-toggle">
                    <button
                        className={mode === 'visual' ? 'active' : ''}
                        onClick={() => setMode('visual')}
                    >
                        Visual
                    </button>
                    <button
                        className={mode === 'code' ? 'active' : ''}
                        onClick={() => setMode('code')}
                    >
                        Code
                    </button>
                </div>
            </div>

            {mode === 'visual' ? (
                <div className="visual-builder">
                    <p className="builder-intro">
                        Define which responses should screen out respondents. They'll be redirected to your screenout page.
                    </p>

                    {/* Step 1: Select Question */}
                    <div className="builder-step">
                        <label className="step-label">
                            <span className="step-number">1</span>
                            Check responses to:
                        </label>
                        <select
                            value={selectedQuestion}
                            onChange={(e) => {
                                setSelectedQuestion(e.target.value);
                                setSelectedSubquestion('');
                                setSelectedValues(new Set());
                            }}
                            className="step-select"
                        >
                            <option value="">Select a question...</option>
                            {availableQuestions.map(q => (
                                <option key={q.id} value={q.code}>
                                    {q.code}: {q.question_text?.substring(0, 50)}...
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Step 2: For array questions, select row */}
                    {isArrayQuestion && subquestions.length > 0 && (
                        <div className="builder-step">
                            <label className="step-label">
                                <span className="step-number">2</span>
                                Which row to check:
                            </label>
                            <select
                                value={selectedSubquestion}
                                onChange={(e) => {
                                    setSelectedSubquestion(e.target.value);
                                    setSelectedValues(new Set());
                                }}
                                className="step-select"
                            >
                                <option value="">Select a row...</option>
                                {subquestions.map(sq => (
                                    <option key={sq.id} value={sq.code}>
                                        {sq.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Step 3: Select screenout type */}
                    {(selectedQuestion && (!isArrayQuestion || selectedSubquestion)) && (
                        <div className="builder-step">
                            <label className="step-label">
                                <span className="step-number">{isArrayQuestion ? '3' : '2'}</span>
                                Screening logic:
                            </label>
                            <div className="screenout-type-selector">
                                <label className={`type-option ${screenoutType === 'pass_if' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="screenoutType"
                                        checked={screenoutType === 'pass_if'}
                                        onChange={() => {
                                            setScreenoutType('pass_if');
                                            setSelectedValues(new Set());
                                        }}
                                    />
                                    <span className="type-icon pass">✓</span>
                                    <span className="type-text">
                                        <strong>Continue if...</strong>
                                        <small>Select answers that QUALIFY</small>
                                    </span>
                                </label>
                                <label className={`type-option ${screenoutType === 'screenout_if' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="screenoutType"
                                        checked={screenoutType === 'screenout_if'}
                                        onChange={() => {
                                            setScreenoutType('screenout_if');
                                            setSelectedValues(new Set());
                                        }}
                                    />
                                    <span className="type-icon screenout">✕</span>
                                    <span className="type-text">
                                        <strong>Screen out if...</strong>
                                        <small>Select answers that DISQUALIFY</small>
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Select answer values */}
                    {(selectedQuestion && (!isArrayQuestion || selectedSubquestion)) && answerOptions.length > 0 && (
                        <div className="builder-step">
                            <label className="step-label">
                                <span className="step-number">{isArrayQuestion ? '4' : '3'}</span>
                                {screenoutType === 'pass_if'
                                    ? 'Select answers that QUALIFY (continue to survey):'
                                    : 'Select answers that DISQUALIFY (screen out):'}
                            </label>
                            <div className="answer-options-grid">
                                {answerOptions.map(ao => (
                                    <label
                                        key={ao.id}
                                        className={`answer-option ${selectedValues.has(ao.code) ? 'selected' : ''} ${screenoutType}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedValues.has(ao.code)}
                                            onChange={() => toggleValue(ao.code)}
                                        />
                                        <span className="option-indicator">
                                            {selectedValues.has(ao.code)
                                                ? (screenoutType === 'pass_if' ? '✓' : '✕')
                                                : ''}
                                        </span>
                                        <span className="option-label">{ao.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {selectedValues.size > 0 && (
                        <div className="preview-box">
                            <div className="preview-header">
                                <span className="preview-icon">👁️</span>
                                <strong>Preview:</strong>
                            </div>
                            <div className="preview-content">
                                {screenoutType === 'pass_if' ? (
                                    <>
                                        <p className="preview-pass">
                                            <span className="badge pass">CONTINUE</span>
                                            if answer is: <strong>{Array.from(selectedValues).map(v =>
                                                answerOptions.find(ao => ao.code === v)?.label
                                            ).join(' or ')}</strong>
                                        </p>
                                        <p className="preview-screenout">
                                            <span className="badge screenout">SCREEN OUT</span>
                                            all other responses
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="preview-screenout">
                                            <span className="badge screenout">SCREEN OUT</span>
                                            if answer is: <strong>{Array.from(selectedValues).map(v =>
                                                answerOptions.find(ao => ao.code === v)?.label
                                            ).join(' or ')}</strong>
                                        </p>
                                        <p className="preview-pass">
                                            <span className="badge pass">CONTINUE</span>
                                            all other responses
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="code-editor">
                    <p className="code-intro">
                        Advanced: Write a custom expression. Use question codes and logical operators.
                    </p>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="e.g., Q1_SQ006 == 'A4' || Q1_SQ006 == 'A5'"
                        className="code-input"
                        rows={3}
                    />
                    <div className="code-help">
                        <strong>Syntax:</strong> <code>==</code> equals, <code>!=</code> not equals,
                        <code>||</code> OR, <code>&&</code> AND, <code>!</code> NOT
                    </div>
                </div>
            )}

            {value && (
                <div className="generated-expression">
                    <small>Generated expression:</small>
                    <code>{value}</code>
                </div>
            )}

            <style jsx>{`
                .screener-builder {
                    background: linear-gradient(135deg, #fff8f5 0%, #fff5f5 100%);
                    border: 1px solid #f5c6cb;
                    border-radius: 12px;
                    padding: 1.25rem;
                }

                .builder-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid #f5c6cb;
                }

                .builder-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin: 0;
                    font-size: 1rem;
                    color: #c94a4a;
                }

                .icon {
                    font-size: 1.25rem;
                }

                .mode-toggle {
                    display: flex;
                    background: #fff;
                    border-radius: 6px;
                    overflow: hidden;
                    border: 1px solid #e0ddd8;
                }

                .mode-toggle button {
                    padding: 0.375rem 0.75rem;
                    border: none;
                    background: transparent;
                    font-size: 0.8125rem;
                    cursor: pointer;
                    color: #666;
                    transition: all 0.15s;
                }

                .mode-toggle button.active {
                    background: #c94a4a;
                    color: white;
                }

                .builder-intro {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0 0 1.25rem 0;
                }

                .builder-step {
                    margin-bottom: 1.25rem;
                }

                .step-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    color: #1a1d24;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }

                .step-number {
                    width: 22px;
                    height: 22px;
                    background: #c94a4a;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .step-select {
                    width: 100%;
                    padding: 0.625rem 0.875rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    background: white;
                    cursor: pointer;
                }

                .step-select:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.1);
                }

                .screenout-type-selector {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                }

                .type-option {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    padding: 0.875rem;
                    background: white;
                    border: 2px solid #e0ddd8;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .type-option:hover {
                    border-color: #c94a4a;
                }

                .type-option.selected {
                    border-color: #c94a4a;
                    background: #fef5f5;
                }

                .type-option input {
                    display: none;
                }

                .type-icon {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 0.875rem;
                }

                .type-icon.pass {
                    background: #dcfce7;
                    color: #15803d;
                }

                .type-icon.screenout {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .type-text {
                    display: flex;
                    flex-direction: column;
                }

                .type-text strong {
                    font-size: 0.875rem;
                    color: #1a1d24;
                }

                .type-text small {
                    font-size: 0.75rem;
                    color: #666;
                }

                .answer-options-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .answer-option {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    padding: 0.75rem 1rem;
                    background: white;
                    border: 2px solid #e0ddd8;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .answer-option:hover {
                    border-color: #999;
                }

                .answer-option input {
                    display: none;
                }

                .answer-option.selected.pass_if {
                    border-color: #15803d;
                    background: #f0fdf4;
                }

                .answer-option.selected.screenout_if {
                    border-color: #dc2626;
                    background: #fef2f2;
                }

                .option-indicator {
                    width: 22px;
                    height: 22px;
                    border: 2px solid #d0cdc8;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: bold;
                    flex-shrink: 0;
                }

                .answer-option.selected.pass_if .option-indicator {
                    background: #15803d;
                    border-color: #15803d;
                    color: white;
                }

                .answer-option.selected.screenout_if .option-indicator {
                    background: #dc2626;
                    border-color: #dc2626;
                    color: white;
                }

                .option-label {
                    font-size: 0.9rem;
                    color: #1a1d24;
                }

                .preview-box {
                    background: white;
                    border: 1px solid #e0ddd8;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-top: 1rem;
                }

                .preview-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    color: #1a1d24;
                }

                .preview-content p {
                    margin: 0.5rem 0;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .badge.pass {
                    background: #dcfce7;
                    color: #15803d;
                }

                .badge.screenout {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .code-editor {
                    padding-top: 0.5rem;
                }

                .code-intro {
                    color: #666;
                    font-size: 0.875rem;
                    margin: 0 0 0.75rem 0;
                }

                .code-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 6px;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 0.8125rem;
                    resize: vertical;
                    background: white;
                }

                .code-input:focus {
                    outline: none;
                    border-color: #c94a4a;
                }

                .code-help {
                    margin-top: 0.5rem;
                    font-size: 0.8125rem;
                    color: #666;
                }

                .code-help code {
                    background: #f0eeea;
                    padding: 0.125rem 0.375rem;
                    border-radius: 3px;
                    margin: 0 0.25rem;
                    font-size: 0.75rem;
                }

                .generated-expression {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: #1a1d24;
                    border-radius: 6px;
                    color: #9ca3af;
                    font-size: 0.8125rem;
                }

                .generated-expression small {
                    display: block;
                    margin-bottom: 0.25rem;
                    color: #6b7280;
                }

                .generated-expression code {
                    color: #fbbf24;
                    font-family: 'Monaco', 'Menlo', monospace;
                    word-break: break-all;
                }

                @media (max-width: 640px) {
                    .screenout-type-selector {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
