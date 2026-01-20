// Language Switch Question Component (LimeSurvey Type I)
// Allows respondents to change the survey language
'use client';

import { useState } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface LanguageSwitchQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

// Default common languages if no answer_options are configured
const DEFAULT_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Espanol' },
    { code: 'fr', label: 'Francais' },
    { code: 'de', label: 'Deutsch' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ar', label: 'Arabic' },
];

export default function LanguageSwitchQuestion({ question, responseData, onAnswer }: LanguageSwitchQuestionProps) {
    const currentValue = responseData.get(question.code) || 'en';
    const [displayMode, setDisplayMode] = useState<'dropdown' | 'buttons'>(
        question.settings.display_columns && question.settings.display_columns > 1 ? 'buttons' : 'dropdown'
    );

    // Use answer_options if configured, otherwise use default languages
    const languages = question.answer_options?.length > 0
        ? question.answer_options.sort((a, b) => a.order_index - b.order_index).map(opt => ({
            code: opt.code,
            label: opt.label
        }))
        : DEFAULT_LANGUAGES;

    const handleLanguageChange = (languageCode: string) => {
        onAnswer(question.code, languageCode);
    };

    // Determine if we should use button group based on number of languages
    const useButtons = displayMode === 'buttons' || languages.length <= 4;

    return (
        <div className="language-switch-question">
            {useButtons ? (
                <div className="language-buttons">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            type="button"
                            className={`language-btn ${currentValue === lang.code ? 'selected' : ''}`}
                            onClick={() => handleLanguageChange(lang.code)}
                            aria-pressed={currentValue === lang.code}
                        >
                            <span className="language-code">{lang.code.toUpperCase()}</span>
                            <span className="language-name">{lang.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="language-dropdown-container">
                    <select
                        value={currentValue}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="language-dropdown"
                        aria-label="Select language"
                    >
                        {languages.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.label} ({lang.code.toUpperCase()})
                            </option>
                        ))}
                    </select>
                    <span className="dropdown-arrow">&#9662;</span>
                </div>
            )}

            <style jsx>{`
                .language-switch-question {
                    width: 100%;
                }

                /* Button Group Styles */
                .language-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }

                .language-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-width: 100px;
                    padding: 0.875rem 1.25rem;
                    border: 2px solid #e0ddd8;
                    border-radius: 6px;
                    background: white;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .language-btn:hover {
                    border-color: #c94a4a;
                    background: #faf9f7;
                }

                .language-btn.selected {
                    border-color: #c94a4a;
                    background: #c94a4a;
                    color: white;
                }

                .language-btn:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.2);
                }

                .language-code {
                    font-size: 0.75rem;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    opacity: 0.7;
                    margin-bottom: 0.25rem;
                }

                .language-btn.selected .language-code {
                    opacity: 0.9;
                }

                .language-name {
                    font-size: 0.9375rem;
                    font-weight: 500;
                }

                /* Dropdown Styles */
                .language-dropdown-container {
                    position: relative;
                    max-width: 300px;
                }

                .language-dropdown {
                    width: 100%;
                    padding: 0.75rem 2.5rem 0.75rem 1rem;
                    border: 2px solid #e0ddd8;
                    border-radius: 6px;
                    background: white;
                    font-family: inherit;
                    font-size: 1rem;
                    color: #1a1d24;
                    cursor: pointer;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    transition: border-color 0.2s ease;
                }

                .language-dropdown:hover {
                    border-color: #c94a4a;
                }

                .language-dropdown:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.2);
                }

                .dropdown-arrow {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                    color: #666;
                    font-size: 0.75rem;
                }

                /* Responsive Styles */
                @media (max-width: 768px) {
                    .language-buttons {
                        flex-direction: column;
                    }

                    .language-btn {
                        width: 100%;
                        flex-direction: row;
                        justify-content: flex-start;
                        gap: 0.75rem;
                        padding: 0.75rem 1rem;
                        min-height: 44px; /* Touch target */
                    }

                    .language-code {
                        margin-bottom: 0;
                        min-width: 2rem;
                    }

                    .language-dropdown-container {
                        max-width: 100%;
                    }

                    .language-dropdown {
                        font-size: 16px; /* Prevents iOS zoom */
                        padding: 0.875rem 2.5rem 0.875rem 1rem;
                        min-height: 44px;
                    }
                }
            `}</style>
        </div>
    );
}
