// Gender Question Component (LimeSurvey Type G)
// Male/Female selection with styled buttons following Editorial Academic theme
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface GenderQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function GenderQuestion({ question, responseData, onAnswer }: GenderQuestionProps) {
    const currentValue = responseData.get(question.code);

    const handleClick = (value: string) => {
        onAnswer(question.code, value);
    };

    return (
        <div className="gender-question">
            <div className="gender-buttons">
                <button
                    type="button"
                    className={`gender-btn ${currentValue === 'M' ? 'selected' : ''}`}
                    onClick={() => handleClick('M')}
                >
                    Male
                </button>
                <button
                    type="button"
                    className={`gender-btn ${currentValue === 'F' ? 'selected' : ''}`}
                    onClick={() => handleClick('F')}
                >
                    Female
                </button>
            </div>

            <style jsx>{`
                .gender-question {
                    width: 100%;
                }

                .gender-buttons {
                    display: flex;
                    gap: 1rem;
                }

                .gender-btn {
                    flex: 1;
                    max-width: 150px;
                    padding: 0.875rem 1.5rem;
                    border: 2px solid #e0ddd8;
                    border-radius: 4px;
                    background: white;
                    font-family: inherit;
                    font-size: 1rem;
                    font-weight: 500;
                    color: #1a1d24;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .gender-btn:hover {
                    border-color: #c94a4a;
                    background: #faf9f7;
                }

                .gender-btn.selected {
                    border-color: #c94a4a;
                    background: #c94a4a;
                    color: white;
                }

                .gender-btn:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.2);
                }

                @media (max-width: 768px) {
                    .gender-buttons {
                        flex-direction: row;
                        justify-content: flex-start;
                    }

                    .gender-btn {
                        max-width: 120px;
                    }
                }
            `}</style>
        </div>
    );
}
