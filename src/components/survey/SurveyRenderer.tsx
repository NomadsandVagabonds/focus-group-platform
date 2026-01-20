'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ExpressionEngine } from '@/lib/survey/expression-engine';
import { ValidationEngine } from '@/lib/survey/validation-engine';
import QuestionLoader from './QuestionLoader';
import type { SurveyWithStructure, QuestionGroup, Question } from '@/lib/supabase/survey-types';

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
    }, [responseId, isPreview]);

    const handleNext = useCallback(() => {
        // Validate current group
        const errors = new Map<string, string>();
        for (const question of visibleQuestions) {
            if (question.mandatory) {
                const value = responseData.get(question.code);
                if (value === undefined || value === null || value === '') {
                    errors.set(question.code, 'This question is required');
                }
            }
        }

        if (errors.size > 0) {
            setValidationErrors(errors);
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

    // Welcome Phase
    if (phase === 'welcome') {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
                {isPreview && <div style={{ background: 'orange', color: 'white', padding: '0.5rem', marginBottom: '1rem' }}>Preview Mode</div>}
                <h1>{settings.welcome_title || survey.title}</h1>
                <p>{settings.welcome_message || survey.description || 'Welcome to this survey.'}</p>
                <button
                    onClick={() => setPhase('questions')}
                    style={{ padding: '1rem 2rem', fontSize: '1.1rem', cursor: 'pointer', marginTop: '1rem' }}
                >
                    {settings.welcome_button_text || 'Start Survey'}
                </button>
            </div>
        );
    }

    // Complete Phase
    if (phase === 'complete') {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
                <h1>{settings.end_title || 'Thank You!'}</h1>
                <p>{settings.end_message || 'Your response has been recorded.'}</p>
                {isPreview ? (
                    <p style={{ color: 'orange' }}>Preview Mode - No data saved</p>
                ) : (
                    <a href={completionUrl} style={{ display: 'inline-block', marginTop: '1rem', padding: '1rem 2rem' }}>
                        Continue
                    </a>
                )}
            </div>
        );
    }

    // Questions Phase
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            {isPreview && <div style={{ background: 'orange', color: 'white', padding: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>Preview Mode</div>}

            <h1>{survey.title}</h1>

            {settings.show_progress_bar !== false && (
                <div style={{ background: '#eee', height: '8px', borderRadius: '4px', marginBottom: '1rem' }}>
                    <div
                        style={{
                            background: '#4CAF50',
                            height: '100%',
                            borderRadius: '4px',
                            width: `${((currentGroupIndex + 1) / visibleGroups.length) * 100}%`,
                            transition: 'width 0.3s',
                        }}
                    />
                </div>
            )}

            {currentGroup && (
                <div style={{ marginBottom: '2rem' }}>
                    {currentGroup.title && <h2>{currentGroup.title}</h2>}
                    {currentGroup.description && <p style={{ color: '#666' }}>{currentGroup.description}</p>}
                </div>
            )}

            {visibleQuestions.map((question, index) => (
                <div key={question.id} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <QuestionLoader
                        question={question}
                        responseData={responseData}
                        onAnswer={handleAnswer}
                        randomizationSeed={responseId}
                        validationError={validationErrors.get(question.code)}
                        responseId={responseId}
                        questionNumber={settings.show_question_number ? index + 1 : undefined}
                        showQuestionCode={settings.show_question_code}
                    />
                </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                {settings.allow_backward_navigation !== false && currentGroupIndex > 0 ? (
                    <button onClick={handleBack} style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}>
                        ← Back
                    </button>
                ) : (
                    <div />
                )}
                <button
                    onClick={handleNext}
                    style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none' }}
                >
                    {currentGroupIndex < visibleGroups.length - 1 ? 'Next →' : 'Submit'}
                </button>
            </div>
        </div>
    );
}
