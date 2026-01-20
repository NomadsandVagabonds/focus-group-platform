// Yes/No Question Component
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface YesNoQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function YesNoQuestion({ question, responseData, onAnswer }: YesNoQuestionProps) {
    const currentValue = responseData.get(question.code);

    const handleClick = (value: string) => {
        onAnswer(question.code, value);
    };

    return (
        <div className="yesno-question">
            <div className="yesno-buttons">
                <button
                    type="button"
                    className={`yesno-btn ${currentValue === 'Y' ? 'selected' : ''}`}
                    onClick={() => handleClick('Y')}
                >
                    Yes
                </button>
                <button
                    type="button"
                    className={`yesno-btn ${currentValue === 'N' ? 'selected' : ''}`}
                    onClick={() => handleClick('N')}
                >
                    No
                </button>
            </div>

            <style jsx>{`
                .yesno-question {
                    width: 100%;
                }

                .yesno-buttons {
                    display: flex;
                    gap: 1rem;
                }

                .yesno-btn {
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

                .yesno-btn:hover {
                    border-color: #c94a4a;
                    background: #faf9f7;
                }

                .yesno-btn.selected {
                    border-color: #c94a4a;
                    background: #c94a4a;
                    color: white;
                }

                .yesno-btn:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(201, 74, 74, 0.2);
                }

                @media (max-width: 768px) {
                    .yesno-buttons {
                        flex-direction: row;
                        justify-content: flex-start;
                    }

                    .yesno-btn {
                        max-width: 120px;
                    }
                }
            `}</style>
        </div>
    );
}
