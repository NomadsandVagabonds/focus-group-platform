/**
 * @deprecated This file is ORPHANED and not imported anywhere.
 * The active renderer is SurveyRenderer.tsx (which uses QuestionLoader for dynamic imports).
 *
 * This file contains potentially useful features that could be migrated:
 * - fetchWithRetry: Retry logic with exponential backoff
 * - ValidationEngine integration
 * - More comprehensive question type handling
 *
 * TODO: Either delete this file or migrate useful features to SurveyRenderer.tsx
 */
// Survey Renderer - Client Component for Taking Surveys
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ExpressionEngine } from '@/lib/survey/expression-engine';
import { ValidationEngine } from '@/lib/survey/validation-engine';
import ArrayQuestion from './questions/ArrayQuestion';
import RankingQuestion from './questions/RankingQuestion';
import DropdownQuestion from './questions/DropdownQuestion';
import YesNoQuestion from './questions/YesNoQuestion';
import DateQuestion from './questions/DateQuestion';
import EquationQuestion from './questions/EquationQuestion';
import NumericalQuestion from './questions/NumericalQuestion';
import MultipleNumericalQuestion from './questions/MultipleNumericalQuestion';
import ArrayNumbersQuestion from './questions/ArrayNumbersQuestion';
import ArrayTextsQuestion from './questions/ArrayTextsQuestion';
import DualScaleArrayQuestion from './questions/DualScaleArrayQuestion';
import TenPointArrayQuestion from './questions/TenPointArrayQuestion';
import YesNoUncertainArrayQuestion from './questions/YesNoUncertainArrayQuestion';
import IncreaseSameDecreaseArrayQuestion from './questions/IncreaseSameDecreaseArrayQuestion';
import Array5PointQuestion from './questions/Array5PointQuestion';
import ListWithCommentQuestion from './questions/ListWithCommentQuestion';
import MultipleChoiceWithCommentsQuestion from './questions/MultipleChoiceWithCommentsQuestion';
import FivePointChoiceQuestion from './questions/FivePointChoiceQuestion';
import HugeFreeTextQuestion from './questions/HugeFreeTextQuestion';
import MultipleShortTextQuestion from './questions/MultipleShortTextQuestion';
import FileUploadQuestion from './questions/FileUploadQuestion';
import SliderQuestion from './questions/SliderQuestion';
import GenderQuestion from './questions/GenderQuestion';
import LanguageSwitchQuestion from './questions/LanguageSwitchQuestion';
import ArrayColumnQuestion from './questions/ArrayColumnQuestion';
import ButtonSelectQuestion from './questions/ButtonSelectQuestion';
import ButtonMultiSelectQuestion from './questions/ButtonMultiSelectQuestion';
import ImageSelectQuestion from './questions/ImageSelectQuestion';
import ImageMultiSelectQuestion from './questions/ImageMultiSelectQuestion';
import NPSQuestion from './questions/NPSQuestion';
import CSATQuestion from './questions/CSATQuestion';
import CESQuestion from './questions/CESQuestion';
import type { SurveyWithStructure, QuestionGroup, Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

// Retry helper with exponential backoff - defined outside component for stability
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number = 3,
    baseDelay: number = 500,
    timeout: number = 10000 // Default 10s timeout, increase for critical operations
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return response;
            }

            // Server error - retry
            if (response.status >= 500) {
                lastError = new Error(`Server error: ${response.status}`);
            } else {
                // Client error - don't retry, return the response so caller can handle
                return response;
            }
        } catch (error: any) {
            lastError = error;
            if (error.name === 'AbortError') {
                lastError = new Error('Request timed out');
            }
        }

        // Exponential backoff before retry
        if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
        }
    }

    throw lastError || new Error('Request failed after retries');
}

interface SurveyRendererProps {
    survey: SurveyWithStructure;
    responseId: string;
    completionUrl: string;
    randomizationSeed?: string;
    isPreview?: boolean;
}

type SurveyPhase = 'welcome' | 'questions' | 'complete' | 'screenout' | 'quota_full';

export default function SurveyRenderer({ survey, responseId, completionUrl, randomizationSeed, isPreview = false }: SurveyRendererProps) {
    // Ensure settings object exists (defensive coding)
    const settings = survey.settings || {};

    // Determine initial phase based on settings
    const initialPhase: SurveyPhase = settings.welcome_enabled !== false ? 'welcome' : 'questions';

    const [phase, setPhase] = useState<SurveyPhase>(initialPhase);
    const [showPreviewBanner, setShowPreviewBanner] = useState(isPreview);
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
    const [responseData, setResponseData] = useState<Map<string, any>>(new Map());
    const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
    const [expressionEngine] = useState(() => new ExpressionEngine(responseData));
    const [saveError, setSaveError] = useState<string | null>(null);
    const [pendingSaves, setPendingSaves] = useState(0);
    const [completionError, setCompletionError] = useState<string | null>(null);

    // Generate randomization seed if not provided
    const seed = useMemo(() => {
        return randomizationSeed || `${responseId}_${Date.now()}`;
    }, [randomizationSeed, responseId]);

    // Update expression engine when response data changes
    useEffect(() => {
        expressionEngine.updateResponseData(responseData);
    }, [responseData, expressionEngine]);

    // Calculate visible groups first (referenced by custom code hooks below)
    const visibleGroups = survey.question_groups
        .filter(group => {
            if (!group.relevance_logic) return true;
            return expressionEngine.evaluate(group.relevance_logic);
        })
        .sort((a, b) => a.order_index - b.order_index);

    const currentGroup = visibleGroups[currentGroupIndex];

    // Ref to store latest responseData for SurveyAPI
    const responseDataRef = useRef<Map<string, any>>(responseData);
    useEffect(() => {
        responseDataRef.current = responseData;
    }, [responseData]);

    // Ref to store the handleAnswer function for SurveyAPI
    const handleAnswerRef = useRef<(questionCode: string, value: any, subquestionCode?: string) => void>(undefined);

    // Debounce pending saves - accumulate changes and batch save
    const pendingSaveQueue = useRef<Map<string, { questionCode: string; value: any; subquestionCode?: string }>>(new Map());
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced save function - waits 500ms of inactivity before saving
    const debouncedSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            if (pendingSaveQueue.current.size === 0 || isPreview) return;

            // Grab current queue and clear it
            const toSave = new Map(pendingSaveQueue.current);
            pendingSaveQueue.current.clear();

            // Save each item (could batch these in a single API call in future)
            for (const [, item] of toSave) {
                await saveResponse(item.questionCode, item.value, item.subquestionCode);
            }
        }, 500); // 500ms debounce - prevents rapid-fire saves
    }, [isPreview]);

    const handleAnswer = useCallback(async (questionCode: string, value: any, subquestionCode?: string) => {
        const key = subquestionCode ? `${questionCode}_${subquestionCode}` : questionCode;

        setResponseData(prev => {
            const newData = new Map(prev);
            newData.set(key, value);
            return newData;
        });

        // Queue save with debouncing (prevents request storms from rapid input)
        pendingSaveQueue.current.set(key, { questionCode, value, subquestionCode });
        debouncedSave();
    }, [debouncedSave]);

    // Update the handleAnswer ref for SurveyAPI
    useEffect(() => {
        handleAnswerRef.current = handleAnswer;
    }, [handleAnswer]);

    // Inject custom CSS scoped to .survey-container
    useEffect(() => {
        if (!settings.custom_css) return;

        const styleId = `survey-custom-css-${survey.id}`;

        // Remove existing style if present
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        // Scope CSS to .survey-container
        const scopedCss = settings.custom_css
            .split('}')
            .map(rule => {
                const trimmed = rule.trim();
                if (!trimmed) return '';
                // Check if rule already has .survey-container scope
                if (trimmed.includes('.survey-container')) {
                    return rule + '}';
                }
                // Add .survey-container scope to each rule
                const [selector, ...rest] = trimmed.split('{');
                if (!selector || rest.length === 0) return rule + '}';
                const scopedSelector = selector
                    .split(',')
                    .map(s => `.survey-container ${s.trim()}`)
                    .join(', ');
                return `${scopedSelector} {${rest.join('{')}}`
            })
            .join('\n');

        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = scopedCss;
        document.head.appendChild(styleElement);

        // Cleanup on unmount
        return () => {
            const style = document.getElementById(styleId);
            if (style) {
                style.remove();
            }
        };
    }, [settings.custom_css, survey.id]);

    // Execute custom JavaScript with SurveyAPI
    useEffect(() => {
        if (!settings.custom_js) return;

        // Create SurveyAPI object for custom scripts
        const SurveyAPI = {
            getResponse: (code: string): any => {
                return responseDataRef.current.get(code);
            },
            setResponse: (code: string, value: any, subquestionCode?: string): void => {
                if (handleAnswerRef.current) {
                    handleAnswerRef.current(code, value, subquestionCode);
                }
            },
            getAllResponses: (): Record<string, any> => {
                const responses: Record<string, any> = {};
                responseDataRef.current.forEach((value, key) => {
                    responses[key] = value;
                });
                return responses;
            },
            getSurveyId: (): string => survey.id,
            getResponseId: (): string => responseId,
            getCurrentGroupIndex: (): number => currentGroupIndex,
            getTotalGroups: (): number => visibleGroups.length,
        };

        // Expose SurveyAPI globally for the custom script
        (window as any).SurveyAPI = SurveyAPI;

        // Execute custom JS in a try-catch to prevent errors from breaking the survey
        try {
            // Create a function from the custom JS and execute it
            const customFunction = new Function('SurveyAPI', settings.custom_js);
            customFunction(SurveyAPI);
        } catch (error) {
            console.error('Error executing custom JavaScript:', error);
        }

        // Cleanup on unmount
        return () => {
            delete (window as any).SurveyAPI;
        };
    }, [settings.custom_js, survey.id, responseId]);

    // Update the SurveyAPI when currentGroupIndex or visibleGroups changes
    useEffect(() => {
        if ((window as any).SurveyAPI) {
            (window as any).SurveyAPI.getCurrentGroupIndex = () => currentGroupIndex;
            (window as any).SurveyAPI.getTotalGroups = () => visibleGroups.length;
        }
    }, [currentGroupIndex, visibleGroups.length]);

    // Confirmation on leave - warn before closing/navigating away
    useEffect(() => {
        if (!settings.confirm_on_leave || isPreview || phase === 'complete') return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Only warn if user has started answering
            if (responseData.size > 0) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [settings.confirm_on_leave, isPreview, phase, responseData.size]);

    const saveResponse = async (questionCode: string, value: any, subquestionCode?: string) => {
        // Skip saving in preview mode
        if (isPreview) return;

        setPendingSaves(prev => prev + 1);

        try {
            await fetchWithRetry('/api/survey/response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response_id: responseId,
                    question_code: questionCode,
                    subquestion_code: subquestionCode,
                    value: value,
                }),
            });

            // Clear error on success
            setSaveError(null);
        } catch (error: any) {
            console.error('Error saving response:', error);
            setSaveError(`Failed to save your answer. Please check your connection and try again.`);
        } finally {
            setPendingSaves(prev => prev - 1);
        }
    };

    // Track last saved state for change detection
    const lastSavedStateRef = useRef<string>('');

    // Autosave function - saves full state periodically, but ONLY if data changed
    const autosave = useCallback(async () => {
        if (isPreview || phase !== 'questions') return;

        // Convert Map to object for JSON serialization
        const answers: Record<string, any> = {};
        responseData.forEach((value, key) => {
            answers[key] = value;
        });

        // Create a hash of current state to detect changes
        const currentStateHash = JSON.stringify({ answers, currentGroupIndex });

        // Skip autosave if nothing changed since last save
        if (currentStateHash === lastSavedStateRef.current) {
            return; // No changes - skip network request
        }

        try {
            // Use retry logic for autosave too - data is critical for Prolific surveys
            // 3 retries with exponential backoff (1s, 2s, 4s) for high-concurrency scenarios
            await fetchWithRetry(`/api/survey/${survey.id}/autosave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response_id: responseId,
                    answers,
                    current_group_index: currentGroupIndex,
                }),
            }, 3, 1000); // 3 retries with 1s base delay for autosave

            // Update last saved state on success
            lastSavedStateRef.current = currentStateHash;

            // Clear any previous save error on successful autosave
            setSaveError(null);
        } catch (error) {
            console.error('Autosave failed after retries:', error);
            // Don't set error for autosave failures - they'll be retried
            // But log for monitoring
        }
    }, [isPreview, phase, responseData, survey.id, responseId, currentGroupIndex]);

    // Periodic autosave every 60 seconds (increased from 30s for high-concurrency)
    // With 5000 users, this reduces autosave load by 50%
    useEffect(() => {
        if (isPreview || phase !== 'questions') return;

        const interval = setInterval(autosave, 60000); // 60 seconds
        return () => clearInterval(interval);
    }, [autosave, isPreview, phase]);

    // Autosave on group navigation (keep this - important for data safety)
    useEffect(() => {
        if (phase === 'questions' && currentGroupIndex > 0) {
            autosave();
        }
    }, [currentGroupIndex, phase, autosave]);

    // Auto-redirect after delay on completion (hook must be unconditional - before any early returns)
    const redirectDelay = settings.end_redirect_delay || 0;
    useEffect(() => {
        if (phase === 'complete' && redirectDelay > 0 && settings.end_redirect_url) {
            const timer = setTimeout(() => {
                window.location.href = settings.end_redirect_url!;
            }, redirectDelay * 1000);
            return () => clearTimeout(timer);
        }
    }, [phase, redirectDelay, settings.end_redirect_url]);

    const validateCurrentGroup = (): boolean => {
        const validationResults = ValidationEngine.validateGroup(visibleQuestions, responseData);

        // Extract error strings from ValidationResult objects
        const errorStrings = new Map<string, string>();
        for (const [key, result] of validationResults) {
            if (result.error) {
                errorStrings.set(key, result.error);
            }
        }
        setValidationErrors(errorStrings);

        if (validationResults.size > 0) {
            // Get the first error to display
            const firstError = validationResults.values().next().value;
            alert(firstError?.error || 'Please complete all required questions.');
            return false;
        }

        // Additional regex validation for text fields
        for (const question of visibleQuestions) {
            if (question.settings.validation_regex) {
                const value = responseData.get(question.code);
                const result = ValidationEngine.validate(question, value);
                if (!result.valid) {
                    setValidationErrors(prev => new Map(prev).set(question.code, result.error || 'Invalid value'));
                    alert(result.error || 'Please enter a valid value.');
                    return false;
                }
            }
        }

        return true;
    };

    const handleNext = () => {
        if (!validateCurrentGroup()) {
            return;
        }

        if (currentGroupIndex < visibleGroups.length - 1) {
            setCurrentGroupIndex(currentGroupIndex + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentGroupIndex > 0) {
            setCurrentGroupIndex(currentGroupIndex - 1);
        }
    };

    // Check quotas to see if respondent should be screened out
    const checkQuotas = useCallback(async (): Promise<{ passed: boolean; action?: string; redirectUrl?: string }> => {
        if (isPreview) return { passed: true };

        try {
            // Convert Map to object for API
            const answers: Record<string, any> = {};
            responseData.forEach((value, key) => {
                answers[key] = value;
            });

            const response = await fetch('/api/survey/quotas/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId: survey.id,
                    responseData: answers,
                }),
            });

            const result = await response.json();

            if (result.fullQuotas && result.fullQuotas.length > 0) {
                // Quota is full - return the action from the first full quota
                const firstFull = result.fullQuotas[0];
                return {
                    passed: false,
                    action: firstFull.action,
                    redirectUrl: firstFull.redirectUrl,
                };
            }

            return { passed: true };
        } catch {
            // If quota check fails, allow to continue
            return { passed: true };
        }
    }, [isPreview, responseData, survey.id]);

    const handleComplete = async () => {
        // Check quotas before completing
        const quotaCheck = await checkQuotas();
        if (!quotaCheck.passed) {
            if (quotaCheck.action === 'screenout') {
                setPhase('screenout');
                return;
            } else if (quotaCheck.action === 'redirect' && quotaCheck.redirectUrl) {
                window.location.href = quotaCheck.redirectUrl;
                return;
            } else if (quotaCheck.action === 'stop') {
                setPhase('quota_full');
                return;
            }
        }

        // Mark response as complete (skip in preview mode)
        // CRITICAL: This is the most important API call - ensure Prolific participants get completion credit
        if (!isPreview) {
            try {
                const completeResponse = await fetchWithRetry(
                    `/api/survey/response/${responseId}/complete`,
                    { method: 'POST' },
                    3, // 3 retries for reliability
                    1000, // 1s base delay between retries
                    20000 // 20s timeout - longer for completion to handle high load
                );

                if (!completeResponse.ok) {
                    throw new Error('Failed to mark response as complete');
                }
            } catch (error: any) {
                console.error('Error completing survey:', error);
                setCompletionError('There was a problem submitting your survey. Please try again.');
                return; // Don't proceed to completion if API fails
            }
        }

        // Show completion page if enabled, otherwise redirect
        if (settings.end_enabled !== false) {
            setPhase('complete');
        } else if (!isPreview) {
            window.location.href = completionUrl;
        } else {
            // In preview mode, just show completion phase
            setPhase('complete');
        }
    };

    const handleStartSurvey = () => {
        setPhase('questions');
    };

    const handleRedirectAfterComplete = () => {
        const redirectUrl = settings.end_redirect_url || completionUrl;
        window.location.href = redirectUrl;
    };

    // Preview Banner Component
    const PreviewBanner = () => {
        if (!showPreviewBanner) return null;
        return (
            <div className="preview-banner">
                <span className="preview-icon">👁</span>
                <span className="preview-text">Preview Mode - Responses will not be saved</span>
                <button
                    onClick={() => setShowPreviewBanner(false)}
                    className="preview-dismiss"
                    aria-label="Dismiss preview banner"
                >
                    ×
                </button>
                <style jsx>{`
                    .preview-banner {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background: linear-gradient(90deg, #f59e0b, #d97706);
                        color: white;
                        padding: 0.75rem 1rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.75rem;
                        font-weight: 500;
                        font-size: 0.9375rem;
                        z-index: 1000;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    }
                    .preview-icon {
                        font-size: 1.25rem;
                    }
                    .preview-text {
                        flex: 0 0 auto;
                    }
                    .preview-dismiss {
                        position: absolute;
                        right: 1rem;
                        background: none;
                        border: none;
                        color: white;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0;
                        line-height: 1;
                        opacity: 0.8;
                    }
                    .preview-dismiss:hover {
                        opacity: 1;
                    }
                `}</style>
            </div>
        );
    };

    // Render Welcome Page
    if (phase === 'welcome') {
        return (
            <>
                <PreviewBanner />
                <div className="survey-container" style={showPreviewBanner ? { paddingTop: '4rem' } : undefined}>
                    <div className="welcome-page">
                        <h1>{settings.welcome_title || 'Welcome'}</h1>
                        {survey.description && <p className="survey-description">{survey.description}</p>}
                        <div className="welcome-message">
                            {settings.welcome_message || 'Thank you for participating in this survey.'}
                        </div>
                        <button onClick={handleStartSurvey} className="btn-primary btn-large">
                            {settings.welcome_button_text || 'Start Survey'}
                        </button>
                    </div>
                    <style jsx>{`
                    .survey-container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 2rem;
                        background: #f5f3ef;
                        min-height: 100vh;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                    .welcome-page {
                        text-align: center;
                        padding: 3rem 2rem;
                        background: #fafaf8;
                        border: 1px solid #e0ddd8;
                        border-radius: 8px;
                    }
                    .welcome-page h1 {
                        font-family: 'EB Garamond', Georgia, serif;
                        font-size: 2rem;
                        color: #1a1d24;
                        margin-bottom: 1rem;
                    }
                    .survey-description {
                        color: #666;
                        font-size: 1rem;
                        margin-bottom: 1.5rem;
                        line-height: 1.6;
                    }
                    .welcome-message {
                        color: #444;
                        font-size: 1rem;
                        line-height: 1.8;
                        margin-bottom: 2rem;
                        white-space: pre-line;
                    }
                    .btn-primary {
                        background: #c94a4a;
                        color: white;
                        border: none;
                        padding: 1rem 3rem;
                        font-size: 1.125rem;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .btn-primary:hover {
                        background: #b03a3a;
                    }
                `}</style>
                </div>
            </>
        );
    }

    // Render Completion Page
    if (phase === 'complete') {
        return (
            <>
                <PreviewBanner />
                <div className="survey-container" style={showPreviewBanner ? { paddingTop: '4rem' } : undefined}>
                    <div className="complete-page">
                        <div className="success-icon">✓</div>
                        <h1>{settings.end_title || 'Thank You'}</h1>
                        <div className="complete-message">
                            {isPreview ? 'Preview complete! No data was saved.' : (settings.end_message || 'Your response has been recorded. Thank you for your participation.')}
                        </div>
                        {!isPreview && settings.prolific_integration?.enabled && settings.prolific_integration?.completion_code && (
                            <div className="completion-code">
                                <p>Your completion code:</p>
                                <code>{settings.prolific_integration.completion_code}</code>
                            </div>
                        )}
                        {isPreview ? (
                            <button onClick={() => window.close()} className="btn-primary">
                                Close Preview
                            </button>
                        ) : settings.end_redirect_url && (
                            <button onClick={handleRedirectAfterComplete} className="btn-primary">
                                Continue
                            </button>
                        )}
                    </div>
                    <style jsx>{`
                    .survey-container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 2rem;
                        background: #f5f3ef;
                        min-height: 100vh;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                    .complete-page {
                        text-align: center;
                        padding: 3rem 2rem;
                        background: #fafaf8;
                        border: 1px solid #e0ddd8;
                        border-radius: 8px;
                    }
                    .success-icon {
                        width: 80px;
                        height: 80px;
                        background: #22c55e;
                        color: white;
                        font-size: 3rem;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1.5rem;
                    }
                    .complete-page h1 {
                        font-family: 'EB Garamond', Georgia, serif;
                        font-size: 2rem;
                        color: #1a1d24;
                        margin-bottom: 1rem;
                    }
                    .complete-message {
                        color: #444;
                        font-size: 1rem;
                        line-height: 1.8;
                        margin-bottom: 2rem;
                        white-space: pre-line;
                    }
                    .completion-code {
                        background: #f0fdf4;
                        border: 1px solid #22c55e;
                        border-radius: 8px;
                        padding: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    .completion-code p {
                        margin: 0 0 0.5rem;
                        color: #166534;
                        font-size: 0.875rem;
                    }
                    .completion-code code {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #166534;
                        letter-spacing: 0.1em;
                    }
                    .btn-primary {
                        background: #c94a4a;
                        color: white;
                        border: none;
                        padding: 0.75rem 2rem;
                        font-size: 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .btn-primary:hover {
                        background: #b03a3a;
                    }
                `}</style>
                </div>
            </>
        );
    }

    // Render Screenout Page
    if (phase === 'screenout') {
        // Build screenout redirect URL - prioritize Prolific, then custom, then none
        const screenoutRedirectUrl = settings.prolific_integration?.enabled && settings.prolific_integration?.screenout_code
            ? `https://app.prolific.com/submissions/complete?cc=${settings.prolific_integration.screenout_code}`
            : settings.screenout_redirect_url || null;

        // Auto-redirect after delay for Prolific studies
        const handleScreenoutRedirect = () => {
            if (screenoutRedirectUrl && !isPreview) {
                window.location.href = screenoutRedirectUrl;
            }
        };

        return (
            <>
                <PreviewBanner />
                <div className="survey-container" style={showPreviewBanner ? { paddingTop: '4rem' } : undefined}>
                    <div className="screenout-page">
                        <h1>{settings.screenout_title || 'Thank You'}</h1>
                        <div className="screenout-message">
                            {settings.screenout_message || 'Unfortunately, you do not qualify for this survey at this time. Thank you for your interest.'}
                        </div>
                        {settings.prolific_integration?.enabled && settings.prolific_integration?.screenout_code && (
                            <div className="screenout-code">
                                <p>Your completion code:</p>
                                <code>{settings.prolific_integration.screenout_code}</code>
                                <p className="screenout-redirect-notice">You will be redirected to Prolific automatically...</p>
                            </div>
                        )}
                        {screenoutRedirectUrl && (
                            <button onClick={handleScreenoutRedirect} className="btn-primary">
                                {settings.prolific_integration?.enabled ? 'Return to Prolific' : 'Continue'}
                            </button>
                        )}
                    </div>
                    <style jsx>{`
                    .survey-container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 2rem;
                        background: #f5f3ef;
                        min-height: 100vh;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                    .screenout-page {
                        text-align: center;
                        padding: 3rem 2rem;
                        background: #fafaf8;
                        border: 1px solid #e0ddd8;
                        border-radius: 8px;
                    }
                    .screenout-page h1 {
                        font-family: 'EB Garamond', Georgia, serif;
                        font-size: 2rem;
                        color: #1a1d24;
                        margin-bottom: 1rem;
                    }
                    .screenout-message {
                        color: #666;
                        font-size: 1rem;
                        line-height: 1.8;
                        margin-bottom: 2rem;
                        white-space: pre-line;
                    }
                    .screenout-code {
                        background: #fef3c7;
                        border: 1px solid #f59e0b;
                        border-radius: 8px;
                        padding: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    .screenout-code p {
                        margin: 0 0 0.5rem;
                        color: #92400e;
                        font-size: 0.875rem;
                    }
                    .screenout-code code {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #92400e;
                        letter-spacing: 0.1em;
                        display: block;
                        margin: 0.5rem 0;
                    }
                    .screenout-redirect-notice {
                        font-size: 0.8rem;
                        color: #b45309;
                        margin-top: 0.75rem !important;
                    }
                    .btn-primary {
                        background: #c94a4a;
                        color: white;
                        border: none;
                        padding: 0.875rem 2.5rem;
                        font-size: 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background 0.2s;
                        font-weight: 500;
                    }
                    .btn-primary:hover {
                        background: #b43939;
                    }
                    .btn-secondary {
                        background: #e0ddd8;
                        color: #1a1d24;
                        border: none;
                        padding: 0.75rem 2rem;
                        font-size: 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .btn-secondary:hover {
                        background: #d0cdc8;
                    }
                `}</style>
                </div>
            </>
        );
    }

    // Render Quota Full Page
    if (phase === 'quota_full') {
        // Build quota full redirect URL - prioritize Prolific screenout code, then custom, then none
        const quotaFullRedirectUrl = settings.prolific_integration?.enabled && settings.prolific_integration?.screenout_code
            ? `https://app.prolific.com/submissions/complete?cc=${settings.prolific_integration.screenout_code}`
            : settings.quota_full_redirect_url || null;

        const handleQuotaRedirect = () => {
            if (quotaFullRedirectUrl && !isPreview) {
                window.location.href = quotaFullRedirectUrl;
            }
        };

        return (
            <>
                <PreviewBanner />
                <div className="survey-container" style={showPreviewBanner ? { paddingTop: '4rem' } : undefined}>
                    <div className="quota-page">
                        <h1>{settings.quota_full_title || 'Survey Closed'}</h1>
                        <div className="quota-message">
                            {settings.quota_full_message || 'This survey has reached its quota and is no longer accepting responses. Thank you for your interest.'}
                        </div>
                        {settings.prolific_integration?.enabled && settings.prolific_integration?.screenout_code && (
                            <div className="quota-code">
                                <p>Your completion code:</p>
                                <code>{settings.prolific_integration.screenout_code}</code>
                                <p className="quota-redirect-notice">You will be redirected to Prolific automatically...</p>
                            </div>
                        )}
                        {quotaFullRedirectUrl && (
                            <button onClick={handleQuotaRedirect} className="btn-primary">
                                {settings.prolific_integration?.enabled ? 'Return to Prolific' : 'Continue'}
                            </button>
                        )}
                    </div>
                    <style jsx>{`
                    .survey-container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 2rem;
                        background: #f5f3ef;
                        min-height: 100vh;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }
                    .quota-page {
                        text-align: center;
                        padding: 3rem 2rem;
                        background: #fafaf8;
                        border: 1px solid #e0ddd8;
                        border-radius: 8px;
                    }
                    .quota-page h1 {
                        font-family: 'EB Garamond', Georgia, serif;
                        font-size: 2rem;
                        color: #1a1d24;
                        margin-bottom: 1rem;
                    }
                    .quota-message {
                        color: #666;
                        font-size: 1rem;
                        line-height: 1.8;
                        margin-bottom: 2rem;
                        white-space: pre-line;
                    }
                    .quota-code {
                        background: #fef3c7;
                        border: 1px solid #f59e0b;
                        border-radius: 8px;
                        padding: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    .quota-code p {
                        margin: 0 0 0.5rem;
                        color: #92400e;
                        font-size: 0.875rem;
                    }
                    .quota-code code {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #92400e;
                        letter-spacing: 0.1em;
                        display: block;
                        margin: 0.5rem 0;
                    }
                    .quota-redirect-notice {
                        font-size: 0.8rem;
                        color: #b45309;
                        margin-top: 0.75rem !important;
                    }
                    .btn-primary {
                        background: #c94a4a;
                        color: white;
                        border: none;
                        padding: 0.875rem 2.5rem;
                        font-size: 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background 0.2s;
                        font-weight: 500;
                    }
                    .btn-primary:hover {
                        background: #b43939;
                    }
                    .btn-secondary {
                        background: #e0ddd8;
                        color: #1a1d24;
                        border: none;
                        padding: 0.75rem 2rem;
                        font-size: 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .btn-secondary:hover {
                        background: #d0cdc8;
                    }
                `}</style>
                </div>
            </>
        );
    }

    if (!currentGroup) {
        return <div>Loading...</div>;
    }

    const visibleQuestions = currentGroup.questions
        .filter(q => {
            // Keep ALL questions, even hidden ones, so their logic/state exists
            // But still filter out non-relevant ones (unless they are hidden equations that might need to run?)
            // Actually, if a question is hidden via settings, we STILL want it to exist.

            // If it's not relevant (logic evaluates to false), we generally remove it.
            // EXCEPT if it's an Equation question that might be used for calculations?
            // LimeSurvey standard: Irrelevant questions are cleared/hidden.
            // So we ONLY filter based on relevance logic.
            if (!q.relevance_logic) return true;
            return expressionEngine.evaluate(q.relevance_logic);
        })
        .sort((a, b) => a.order_index - b.order_index);

    // Error banner component
    const ErrorBanner = () => {
        const error = saveError || completionError;
        if (!error) return null;

        return (
            <div className="error-banner" role="alert">
                <span className="error-icon">⚠</span>
                <span className="error-text">{error}</span>
                <button
                    onClick={() => {
                        setSaveError(null);
                        setCompletionError(null);
                    }}
                    className="error-dismiss"
                    aria-label="Dismiss error"
                >
                    ×
                </button>
                <style jsx>{`
                    .error-banner {
                        position: fixed;
                        top: ${showPreviewBanner ? '48px' : '0'};
                        left: 0;
                        right: 0;
                        background: linear-gradient(90deg, #dc2626, #b91c1c);
                        color: white;
                        padding: 0.75rem 1rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.75rem;
                        font-weight: 500;
                        font-size: 0.9375rem;
                        z-index: 999;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    }
                    .error-icon {
                        font-size: 1.25rem;
                    }
                    .error-text {
                        flex: 0 0 auto;
                    }
                    .error-dismiss {
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 1rem;
                        line-height: 1;
                        margin-left: 0.5rem;
                    }
                    .error-dismiss:hover {
                        background: rgba(255,255,255,0.3);
                    }
                `}</style>
            </div>
        );
    };

    return (
        <>
            <PreviewBanner />
            <ErrorBanner />
            <div className="survey-container" style={(showPreviewBanner || saveError || completionError) ? { paddingTop: saveError || completionError ? '6rem' : '4rem' } : undefined}>
                <div className="survey-header">
                    <h1>{survey.title}</h1>
                    {settings.show_progress_bar && (
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${((currentGroupIndex + 1) / visibleGroups.length) * 100}%` }}
                            />
                        </div>
                    )}
                </div>

                <div className="question-group">
                    {settings.show_group_name !== false && currentGroup.title && (
                        <h2>{currentGroup.title}</h2>
                    )}
                    {settings.show_group_description !== false && currentGroup.description && (
                        <p className="group-description">{currentGroup.description}</p>
                    )}

                    {visibleQuestions.map((question, index) => (
                        <QuestionRenderer
                            key={question.id}
                            question={question}
                            responseData={responseData}
                            onAnswer={handleAnswer}
                            expressionEngine={expressionEngine}
                            randomizationSeed={seed}
                            validationError={validationErrors.get(question.code)}
                            responseId={responseId}
                            questionNumber={settings.show_question_number ? index + 1 : undefined}
                            showQuestionCode={settings.show_question_code}
                        />
                    ))}
                </div>

                <div className="survey-navigation">
                    {settings.allow_backward_navigation && currentGroupIndex > 0 && (
                        <button onClick={handleBack} className="btn-secondary" disabled={pendingSaves > 0}>
                            ← Back
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="btn-primary"
                        disabled={pendingSaves > 0 || !!saveError}
                    >
                        {pendingSaves > 0 ? 'Saving...' : (currentGroupIndex < visibleGroups.length - 1 ? 'Next →' : 'Complete')}
                    </button>
                    {pendingSaves > 0 && (
                        <span className="saving-indicator">
                            <span className="saving-dot"></span>
                            Saving your answers...
                        </span>
                    )}
                </div>

                <style jsx>{`
        .survey-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: #f5f3ef;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        :global(body) {
          background: #f5f3ef !important;
          margin: 0;
          padding: 0;
        }

        .survey-header h1 {
          color: #1a1d24;
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #e5e5e5;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #c94a4a 0%, #b03a3a 100%);
          transition: width 0.3s ease;
        }

        .question-group {
          background: #fafaf8;
          padding: 2rem;
          border-radius: 8px;
          border: 1px solid #e0ddd8;
          margin-bottom: 2rem;
        }

        .question-group h2 {
          color: #1a1d24;
          font-size: 1.125rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .group-description {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .array-table table {
          width: 100%;
          min-width: 600px;
          border-collapse: collapse;
          background: white;
          border: 1px solid #ddd;
        }

        .survey-navigation {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #e0ddd8;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #c94a4a;
          color: white;
        }

        .btn-primary:hover {
          background: #b03a3a;
        }

        .btn-secondary {
          background: #e0ddd8;
          color: #1a1d24;
        }

        .btn-secondary:hover {
          background: #d0cdc8;
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary:disabled:hover {
          background: #c94a4a;
        }

        .saving-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          font-size: 0.875rem;
          margin-left: 1rem;
        }

        .saving-dot {
          width: 8px;
          height: 8px;
          background: #c94a4a;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
            </div>
        </>
    );
}

// Question Renderer Component
interface QuestionRendererProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
    expressionEngine: ExpressionEngine;
    randomizationSeed?: string;
    validationError?: string;
    responseId: string;
    questionNumber?: number;
    showQuestionCode?: boolean;
}

function QuestionRenderer({ question, responseData, onAnswer, expressionEngine, randomizationSeed, validationError, responseId, questionNumber, showQuestionCode }: QuestionRendererProps) {
    const questionText = expressionEngine.pipe(question.question_text);
    const helpText = question.help_text ? expressionEngine.pipe(question.help_text) : '';

    // For equation questions, we MUST render the component so its useEffect logic runs,
    // but we don't want the UI wrapper. The EquationQuestion component itself returns null visually.
    if (question.question_type === 'equation') {
        // Just render the input function (which now returns the EquationQuestion component)
        return renderQuestionInput(question, responseData, onAnswer);
    }

    // For explicitly hidden questions (Survey Builder setting), render them invisibly
    // This allows them to hold state/values or be used in logic without being seen
    // For explicitly hidden questions (Survey Builder setting), render them invisibly
    // This allows them to hold state/values or be used in logic without being seen
    // Check if settings exists to avoid crash
    if (question.settings?.hidden) {
        return (
            <div style={{ display: 'none' }}>
                {renderQuestionInput(question, responseData, onAnswer, randomizationSeed, responseId)}
            </div>
        );
    }

    return (
        <div className={`question ${validationError ? 'has-error' : ''}`} data-code={question.code}>
            <div className="question-text">
                {questionNumber && <span className="question-number">Q{questionNumber}. </span>}
                {showQuestionCode && <span className="question-code">[{question.code}] </span>}
                {questionText}
                {question.settings?.mandatory && <span className="required">*</span>}
            </div>
            {helpText && <div className="help-text">{helpText}</div>}
            {validationError && <div className="validation-error">{validationError}</div>}

            <div className="question-input">
                {renderQuestionInput(question, responseData, onAnswer, randomizationSeed, responseId)}
            </div>

            <style jsx>{`
        .question {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e0ddd8;
        }

        .question:last-child {
          border-bottom: none;
        }

        .question-text {
          font-size: 0.95rem;
          color: #1a1d24;
          margin-bottom: 0.75rem;
          font-weight: normal;
          line-height: 1.6;
        }

        .question-number {
          font-weight: 600;
          color: #c94a4a;
        }

        .question-code {
          font-family: monospace;
          font-size: 0.8rem;
          color: #666;
          background: #f0f0f0;
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
          margin-right: 0.3rem;
        }

        .required {
          color: #c94a4a;
          font-weight: bold;
          margin-left: 0.125rem;
        }

        .help-text {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .question.has-error {
          border-color: #c94a4a;
          background: #fef2f2;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 2rem;
        }

        .validation-error {
          color: #c94a4a;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .question-input {
          margin-top: 1rem;
        }
      `}</style>
        </div>
    );
}

// Render different question types
function renderQuestionInput(
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] },
    responseData: Map<string, any>,
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void,
    randomizationSeed?: string,
    responseId?: string
) {
    const currentValue = responseData.get(question.code);
    // Ensure settings exists to prevent crashes
    const settings = question.settings || {};

    switch (question.question_type) {
        case 'text':
            return (
                <input
                    type="text"
                    value={currentValue || ''}
                    onChange={(e) => onAnswer(question.code, e.target.value)}
                    placeholder={settings.placeholder}
                    className="text-input"
                />
            );

        case 'long_text':
            return (
                <textarea
                    value={currentValue || ''}
                    onChange={(e) => onAnswer(question.code, e.target.value)}
                    placeholder={settings.placeholder}
                    rows={5}
                    className="textarea-input"
                />
            );

        case 'multiple_choice_single':
            return (
                <div className="radio-group">
                    {question.answer_options
                        .sort((a, b) => a.order_index - b.order_index)
                        .map(option => (
                            <label key={option.id} className="radio-option">
                                <input
                                    type="radio"
                                    name={question.code}
                                    value={option.code}
                                    checked={currentValue === option.code}
                                    onChange={(e) => onAnswer(question.code, e.target.value)}
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                </div>
            );

        case 'multiple_choice_multiple':
            const selectedValues = currentValue || [];
            // Use subquestions if answer_options is empty (LimeSurvey pattern)
            let checkboxOptions = question.answer_options?.length > 0
                ? question.answer_options
                : question.subquestions;

            // Apply array_filter if specified
            if (settings.array_filter) {
                const filterQuestion = settings.array_filter;
                const filterValues = (responseData.get(filterQuestion) as string[]) || [];
                checkboxOptions = checkboxOptions.filter(opt => filterValues.includes(opt.code));
            }

            return (
                <div className="checkbox-group">
                    {checkboxOptions
                        .sort((a, b) => a.order_index - b.order_index)
                        .map(option => {
                            const isOther = option.code === 'other';
                            const isChecked = selectedValues.includes(option.code);

                            return (
                                <div key={option.id}>
                                    <label className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            value={option.code}
                                            checked={isChecked}
                                            onChange={(e) => {
                                                const newValues = e.target.checked
                                                    ? [...selectedValues, option.code]
                                                    : selectedValues.filter((v: string) => v !== option.code);
                                                onAnswer(question.code, newValues);
                                            }}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                    {isOther && isChecked && (
                                        <input
                                            type="text"
                                            placeholder="Please specify..."
                                            value={(responseData.get(`${question.code}_other`) as string) || ''}
                                            onChange={(e) => onAnswer(`${question.code}_other`, e.target.value)}
                                            className="other-specify-input"
                                            style={{
                                                marginLeft: '2rem',
                                                marginTop: '0.5rem',
                                                padding: '0.5rem',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                width: '100%',
                                                maxWidth: '300px',
                                                display: 'block',
                                                fontSize: '16px' // Prevents iOS zoom
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                </div>
            );

        case 'array':
            return (
                <ArrayQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                    randomizationSeed={randomizationSeed}
                />
            );

        case 'ranking':
            return (
                <RankingQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                    randomizationSeed={randomizationSeed}
                />
            );

        case 'text_display':
            return (
                <div className="text-display">
                    {question.help_text}
                </div>
            );

        case 'dropdown':
            return (
                <DropdownQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'yes_no':
            return (
                <YesNoQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'date':
            return (
                <DateQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );


        case 'equation':
            return (
                <EquationQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'numerical':
            return (
                <NumericalQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'multiple_numerical':
            return (
                <MultipleNumericalQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'array_numbers':
            return (
                <ArrayNumbersQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'array_texts':
            return (
                <ArrayTextsQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'array_dual_scale':
            return (
                <DualScaleArrayQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'array_10_point':
            return (
                <TenPointArrayQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'array_yes_no_uncertain':
            return (
                <YesNoUncertainArrayQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'array_increase_same_decrease':
            return (
                <IncreaseSameDecreaseArrayQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'array_5_point':
            return (
                <Array5PointQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'list_with_comment':
            return (
                <ListWithCommentQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'multiple_choice_with_comments':
            return (
                <MultipleChoiceWithCommentsQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'five_point_choice':
            return (
                <FivePointChoiceQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'huge_free_text':
            return (
                <HugeFreeTextQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'multiple_short_text':
            return (
                <MultipleShortTextQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'file_upload':
            return (
                <FileUploadQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                    responseId={responseId}
                />
            );

        case 'slider':
            return (
                <SliderQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'gender':
            return (
                <GenderQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'language_switch':
            return (
                <LanguageSwitchQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'array_column':
            return (
                <ArrayColumnQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                    randomizationSeed={randomizationSeed}
                />
            );

        case 'button_select':
            return (
                <ButtonSelectQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                    randomizationSeed={randomizationSeed}
                />
            );

        case 'image_select':
            return (
                <ImageSelectQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                    randomizationSeed={randomizationSeed}
                />
            );

        case 'button_multi_select':
            return (
                <ButtonMultiSelectQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                    randomizationSeed={randomizationSeed}
                />
            );

        case 'image_multi_select':
            return (
                <ImageMultiSelectQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                    randomizationSeed={randomizationSeed}
                />
            );

        case 'nps':
            return (
                <NPSQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'csat':
            return (
                <CSATQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        case 'ces':
            return (
                <CESQuestion
                    question={question}
                    responseData={responseData}
                    onAnswer={onAnswer}
                />
            );

        default:
            return <div>Question type {question.question_type} not yet implemented</div>;
    }
}
