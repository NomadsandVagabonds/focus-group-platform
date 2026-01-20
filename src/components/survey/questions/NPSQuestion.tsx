// NPS (Net Promoter Score) Question Component
// 0-10 scale with promoter/passive/detractor classification
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface NPSQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

// NPS classifications
function getNPSCategory(value: number): 'detractor' | 'passive' | 'promoter' {
    if (value <= 6) return 'detractor';
    if (value <= 8) return 'passive';
    return 'promoter';
}

function getNPSCategoryLabel(value: number): string {
    const category = getNPSCategory(value);
    switch (category) {
        case 'detractor': return 'Detractor';
        case 'passive': return 'Passive';
        case 'promoter': return 'Promoter';
    }
}

export default function NPSQuestion({ question, responseData, onAnswer }: NPSQuestionProps) {
    const currentValue = responseData.get(question.code);
    const currentValueNum = currentValue !== undefined && currentValue !== '' ? parseInt(currentValue, 10) : null;
    const settings = question.settings || {};

    const handleSelect = (value: number) => {
        onAnswer(question.code, value.toString());
    };

    // Customizable labels
    const lowLabel = settings.nps_low_label || 'Not at all likely';
    const highLabel = settings.nps_high_label || 'Extremely likely';
    const showCategoryLabel = settings.nps_show_category !== false;

    return (
        <div className="nps-question">
            {/* Scale labels */}
            <div className="scale-labels">
                <span className="scale-label low">{lowLabel}</span>
                <span className="scale-label high">{highLabel}</span>
            </div>

            {/* NPS Scale 0-10 */}
            <div className="nps-scale">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => {
                    const category = getNPSCategory(value);
                    const isSelected = currentValueNum === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            className={`nps-button ${category} ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelect(value)}
                            aria-pressed={isSelected}
                            aria-label={`${value} - ${getNPSCategoryLabel(value)}`}
                        >
                            {value}
                        </button>
                    );
                })}
            </div>

            {/* Category indicators */}
            <div className="category-indicators">
                <div className="category-segment detractor">
                    <div className="category-bar" />
                    <span className="category-label">Detractors (0-6)</span>
                </div>
                <div className="category-segment passive">
                    <div className="category-bar" />
                    <span className="category-label">Passives (7-8)</span>
                </div>
                <div className="category-segment promoter">
                    <div className="category-bar" />
                    <span className="category-label">Promoters (9-10)</span>
                </div>
            </div>

            {/* Current selection feedback */}
            {currentValueNum !== null && showCategoryLabel && (
                <div className={`selection-feedback ${getNPSCategory(currentValueNum)}`}>
                    You selected <strong>{currentValueNum}</strong> - {getNPSCategoryLabel(currentValueNum)}
                </div>
            )}

            {settings.show_no_answer && (
                <button
                    type="button"
                    className={`no-answer-btn ${currentValue === '' ? 'selected' : ''}`}
                    onClick={() => onAnswer(question.code, '')}
                >
                    No answer
                </button>
            )}

            <style jsx>{`
                .nps-question {
                    margin: 1rem 0;
                    max-width: 700px;
                }

                .scale-labels {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                    padding: 0 0.25rem;
                }

                .scale-label {
                    font-size: 0.875rem;
                    color: #666;
                    max-width: 120px;
                }

                .scale-label.low {
                    text-align: left;
                }

                .scale-label.high {
                    text-align: right;
                }

                .nps-scale {
                    display: flex;
                    gap: 4px;
                    justify-content: center;
                }

                .nps-button {
                    flex: 1;
                    min-width: 0;
                    max-width: 54px;
                    height: 48px;
                    border: 2px solid;
                    border-radius: 6px;
                    background: white;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Detractor colors (0-6) - Red spectrum */
                .nps-button.detractor {
                    border-color: #f87171;
                    color: #dc2626;
                }

                .nps-button.detractor:hover {
                    background: #fef2f2;
                }

                .nps-button.detractor.selected {
                    background: #dc2626;
                    border-color: #dc2626;
                    color: white;
                }

                /* Passive colors (7-8) - Yellow/amber spectrum */
                .nps-button.passive {
                    border-color: #fbbf24;
                    color: #d97706;
                }

                .nps-button.passive:hover {
                    background: #fffbeb;
                }

                .nps-button.passive.selected {
                    background: #f59e0b;
                    border-color: #f59e0b;
                    color: white;
                }

                /* Promoter colors (9-10) - Green spectrum */
                .nps-button.promoter {
                    border-color: #4ade80;
                    color: #16a34a;
                }

                .nps-button.promoter:hover {
                    background: #f0fdf4;
                }

                .nps-button.promoter.selected {
                    background: #16a34a;
                    border-color: #16a34a;
                    color: white;
                }

                .nps-button:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
                }

                /* Category indicators below the scale */
                .category-indicators {
                    display: flex;
                    margin-top: 0.75rem;
                    gap: 4px;
                }

                .category-segment {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .category-segment.detractor {
                    flex: 7; /* 0-6 = 7 buttons */
                }

                .category-segment.passive {
                    flex: 2; /* 7-8 = 2 buttons */
                }

                .category-segment.promoter {
                    flex: 2; /* 9-10 = 2 buttons */
                }

                .category-bar {
                    height: 4px;
                    width: 100%;
                    border-radius: 2px;
                }

                .category-segment.detractor .category-bar {
                    background: linear-gradient(90deg, #fca5a5, #f87171);
                }

                .category-segment.passive .category-bar {
                    background: #fbbf24;
                }

                .category-segment.promoter .category-bar {
                    background: linear-gradient(90deg, #4ade80, #22c55e);
                }

                .category-label {
                    font-size: 0.7rem;
                    color: #888;
                    margin-top: 0.375rem;
                    text-align: center;
                    white-space: nowrap;
                }

                /* Selection feedback */
                .selection-feedback {
                    margin-top: 1rem;
                    padding: 0.75rem 1rem;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    text-align: center;
                }

                .selection-feedback.detractor {
                    background: #fef2f2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                }

                .selection-feedback.passive {
                    background: #fffbeb;
                    color: #92400e;
                    border: 1px solid #fde68a;
                }

                .selection-feedback.promoter {
                    background: #f0fdf4;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }

                .selection-feedback strong {
                    font-weight: 700;
                }

                .no-answer-btn {
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    font-size: 0.875rem;
                    color: #666;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .no-answer-btn:hover {
                    background: #f5f3ef;
                }

                .no-answer-btn.selected {
                    background: #e0ddd8;
                    color: #333;
                }

                /* Responsive adjustments */
                @media (max-width: 640px) {
                    .nps-scale {
                        gap: 3px;
                    }

                    .nps-button {
                        height: 42px;
                        font-size: 0.95rem;
                        border-radius: 4px;
                    }

                    .scale-labels {
                        flex-direction: column;
                        gap: 0.25rem;
                        margin-bottom: 0.5rem;
                    }

                    .scale-label {
                        max-width: none;
                    }

                    .scale-label.low,
                    .scale-label.high {
                        text-align: center;
                    }

                    .category-label {
                        font-size: 0.6rem;
                    }

                    .selection-feedback {
                        font-size: 0.85rem;
                    }
                }

                @media (max-width: 400px) {
                    .nps-scale {
                        gap: 2px;
                    }

                    .nps-button {
                        height: 36px;
                        font-size: 0.85rem;
                        border-width: 1.5px;
                    }

                    .category-indicators {
                        display: none; /* Hide on very small screens */
                    }
                }
            `}</style>
        </div>
    );
}
