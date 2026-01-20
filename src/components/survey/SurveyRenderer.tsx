'use client';

import { useState, useMemo, useCallback } from 'react';
import { ExpressionEngine } from '@/lib/survey/expression-engine';
import QuestionLoader from './QuestionLoader';
import type { SurveyWithStructure } from '@/lib/supabase/survey-types';

interface SurveyRendererProps {
    survey: SurveyWithStructure;
    responseId: string;
    completionUrl: string;
    isPreview?: boolean;
}

type SurveyPhase = 'welcome' | 'questions' | 'complete';

export default function SurveyRenderer({ survey, responseId, completionUrl, isPreview = false }: SurveyRendererProps) {
    const settings = survey.settings || {};
    const initialPhase: SurveyPhase = settings.welcome_enabled !== false ? 'welcome' : 'questions';

    const [phase, setPhase] = useState<SurveyPhase>(initialPhase);
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
    const [responseData, setResponseData] = useState<Map<string, any>>(new Map());
    const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

    // Sort groups by sort_order
    const sortedGroups = useMemo(() => {
        return [...(survey.question_groups || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [survey.question_groups]);

    // Filter visible groups
    const visibleGroups = useMemo(() => {
        return sortedGroups.filter(group => {
            if (!group.relevance || group.relevance === '1') return true;
            try {
                const engine = new ExpressionEngine(responseData);
                return engine.evaluate(group.relevance);
            } catch {
                return true;
            }
        });
    }, [sortedGroups, responseData]);

    const currentGroup = visibleGroups[currentGroupIndex] || sortedGroups[0];

    // Get visible questions for current group
    const visibleQuestions = useMemo(() => {
        if (!currentGroup?.questions) return [];
        return currentGroup.questions
            .filter(q => {
                if (!q.relevance || q.relevance === '1') return true;
                try {
                    const engine = new ExpressionEngine(responseData);
                    return engine.evaluate(q.relevance);
                } catch {
                    return true;
                }
            })
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [currentGroup, responseData]);

    const handleAnswer = useCallback((questionCode: string, value: any, subquestionCode?: string) => {
        const key = subquestionCode ? `${questionCode}_${subquestionCode}` : questionCode;
        setResponseData(prev => {
            const newData = new Map(prev);
            newData.set(key, value);
            return newData;
        });

        // Clear validation error when user answers
        if (validationErrors.has(questionCode)) {
            setValidationErrors(prev => {
                const newErrors = new Map(prev);
                newErrors.delete(questionCode);
                return newErrors;
            });
        }

        // Save to server (skip in preview)
        if (!isPreview) {
            fetch('/api/survey/response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response_id: responseId,
                    question_code: questionCode,
                    subquestion_code: subquestionCode,
                    value: value,
                }),
            }).catch(err => console.error('Error saving response:', err));
        }
    }, [responseId, isPreview, validationErrors]);

    const handleNext = useCallback(() => {
        // Validate current group
        const errors = new Map<string, string>();
        for (const question of visibleQuestions) {
            // Skip hidden/equation questions
            const qType = question.question_type || (question as any).type;
            if (qType === 'equation' || qType === '*' || question.settings?.hidden) {
                continue;
            }

            if (question.mandatory || question.settings?.mandatory) {
                // For array questions, check if all subquestions are answered
                if (question.subquestions && question.subquestions.length > 0) {
                    const unanswered = question.subquestions.some(subq => {
                        const key = `${question.code}_${subq.code}`;
                        const value = responseData.get(key);
                        return value === undefined || value === null || value === '';
                    });
                    if (unanswered) {
                        errors.set(question.code, 'Please answer all rows in this question');
                    }
                } else {
                    // Simple question - check direct value
                    const value = responseData.get(question.code);
                    if (value === undefined || value === null || value === '') {
                        errors.set(question.code, 'This question is required');
                    }
                }
            }
        }

        if (errors.size > 0) {
            setValidationErrors(errors);
            // Scroll to first error
            const firstErrorKey = errors.keys().next().value;
            const errorElement = document.querySelector(`[data-question="${firstErrorKey}"]`);
            errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setValidationErrors(new Map());

        if (currentGroupIndex < visibleGroups.length - 1) {
            setCurrentGroupIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            // Complete survey
            if (!isPreview) {
                fetch(`/api/survey/response/${responseId}/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }).then(() => {
                    setPhase('complete');
                }).catch(err => {
                    console.error('Error completing survey:', err);
                    setPhase('complete');
                });
            } else {
                setPhase('complete');
            }
        }
    }, [currentGroupIndex, visibleGroups.length, visibleQuestions, responseData, responseId, isPreview]);

    const handleBack = useCallback(() => {
        if (currentGroupIndex > 0) {
            setCurrentGroupIndex(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    }, [currentGroupIndex]);

    const progressPercent = visibleGroups.length > 0
        ? Math.round(((currentGroupIndex) / visibleGroups.length) * 100)
        : 0;

    // Welcome Phase
    if (phase === 'welcome') {
        return (
            <div className="survey-page">
                {isPreview && <div className="preview-banner">Preview Mode</div>}
                <div className="survey-card welcome-card">
                    <h1>{settings.welcome_title || survey.title}</h1>
                    <p>{settings.welcome_message || survey.description || 'Welcome to this survey.'}</p>
                    <button className="btn-primary" onClick={() => setPhase('questions')}>
                        {settings.welcome_button_text || 'Start Survey'}
                    </button>
                </div>
                <style jsx>{surveyStyles}</style>
            </div>
        );
    }

    // Complete Phase
    if (phase === 'complete') {
        return (
            <div className="survey-page">
                <div className="survey-card welcome-card">
                    <h1>{settings.end_title || 'Thank You!'}</h1>
                    <p>{settings.end_message || 'Your response has been recorded.'}</p>
                    {isPreview ? (
                        <p className="preview-note">Preview Mode - No data saved</p>
                    ) : (
                        <a href={completionUrl} className="btn-primary">
                            Continue
                        </a>
                    )}
                </div>
                <style jsx>{surveyStyles}</style>
            </div>
        );
    }

    // Questions Phase
    return (
        <div className="survey-page">
            {isPreview && <div className="preview-banner">Preview Mode</div>}

            {/* Progress bar */}
            {settings.show_progress_bar !== false && (
                <div className="progress-container">
                    <div className="progress-text">{progressPercent}%</div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>
            )}

            {/* Question card */}
            <div className="survey-card">
                {visibleQuestions.map((question, index) => {
                    // Skip hidden/equation questions entirely
                    const qType = question.question_type || (question as any).type;
                    if (qType === 'equation' || qType === '*' || question.settings?.hidden) {
                        return null;
                    }

                    return (
                        <div
                            key={question.id}
                            className={`question-wrapper ${validationErrors.has(question.code) ? 'has-error' : ''}`}
                            data-question={question.code}
                        >
                            <QuestionLoader
                                question={question}
                                responseData={responseData}
                                onAnswer={handleAnswer}
                                randomizationSeed={responseId}
                                validationError={validationErrors.get(question.code)}
                                responseId={responseId}
                                questionNumber={settings.show_question_number !== false ? index + 1 : undefined}
                                showQuestionCode={settings.show_question_code}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Navigation */}
            <div className="nav-container">
                <div className="nav-left">
                    {settings.allow_backward_navigation !== false && currentGroupIndex > 0 && (
                        <button className="btn-secondary" onClick={handleBack}>
                            ← Previous
                        </button>
                    )}
                </div>
                <div className="nav-right">
                    <button className="btn-primary" onClick={handleNext}>
                        {currentGroupIndex < visibleGroups.length - 1 ? 'Next' : 'Submit'}
                    </button>
                </div>
            </div>

            <style jsx>{surveyStyles}</style>
        </div>
    );
}

const surveyStyles = `
    .survey-page {
        min-height: 100vh;
        background: #d4c5b0;
        padding: 2rem 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1a1d24;
    }

    .preview-banner {
        background: #f5a623;
        color: white;
        text-align: center;
        padding: 0.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        border-radius: 4px;
        max-width: 900px;
        margin-left: auto;
        margin-right: auto;
    }

    .progress-container {
        max-width: 900px;
        margin: 0 auto 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .progress-text {
        color: #c94a4a;
        font-weight: 700;
        font-size: 0.875rem;
        min-width: 40px;
    }

    .progress-bar {
        flex: 1;
        height: 6px;
        background: #e0ddd8;
        border-radius: 3px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #c94a4a;
        transition: width 0.3s ease;
    }

    .survey-card {
        background: white;
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .welcome-card {
        text-align: center;
        padding: 3rem 2rem;
    }

    .welcome-card h1 {
        font-size: 1.75rem;
        margin-bottom: 1rem;
        color: #1a1d24;
    }

    .welcome-card p {
        font-size: 1.1rem;
        color: #666;
        margin-bottom: 2rem;
        line-height: 1.6;
    }

    .preview-note {
        color: #f5a623;
        font-style: italic;
    }

    .question-wrapper {
        padding: 1.5rem 0;
        border-bottom: 1px solid #e8e5e0;
    }

    .question-wrapper:last-child {
        border-bottom: none;
    }

    .question-wrapper.has-error {
        background: #fff8f8;
        margin: 0 -2rem;
        padding: 1.5rem 2rem;
        border-left: 3px solid #c94a4a;
    }

    .nav-container {
        max-width: 900px;
        margin: 1.5rem auto 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .nav-left, .nav-right {
        display: flex;
        gap: 0.5rem;
    }

    .btn-primary {
        background: #c94a4a;
        color: white;
        border: none;
        padding: 0.875rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
        text-decoration: none;
        display: inline-block;
    }

    .btn-primary:hover {
        background: #b03a3a;
    }

    .btn-secondary {
        background: transparent;
        color: #666;
        border: 1px solid #ccc;
        padding: 0.875rem 1.5rem;
        font-size: 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-secondary:hover {
        background: #f5f3ef;
        border-color: #999;
    }

    @media (max-width: 768px) {
        .survey-page {
            padding: 1rem 0.5rem;
        }

        .survey-card {
            padding: 1.5rem 1rem;
            border-radius: 0;
        }

        .question-wrapper.has-error {
            margin: 0 -1rem;
            padding: 1.5rem 1rem;
        }

        .btn-primary, .btn-secondary {
            padding: 0.75rem 1.25rem;
        }
    }
`;
