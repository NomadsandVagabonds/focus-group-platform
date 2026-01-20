// Multiple Choice with Comments Question Component (LimeSurvey Type P)
// Checkboxes where each option has its own comment field
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface MultipleChoiceWithCommentsQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function MultipleChoiceWithCommentsQuestion({ question, responseData, onAnswer }: MultipleChoiceWithCommentsQuestionProps) {
    const answerOptions = question.answer_options.sort((a, b) => a.order_index - b.order_index);

    const handleCheckboxChange = (optionCode: string, checked: boolean) => {
        const key = `${question.code}_${optionCode}`;
        onAnswer(question.code, checked ? 'Y' : '', optionCode);
    };

    const handleCommentChange = (optionCode: string, comment: string) => {
        onAnswer(question.code, comment, `${optionCode}_comment`);
    };

    return (
        <div className="multiple-choice-comments-question">
            <div className="options-list">
                {answerOptions.map(option => {
                    const isChecked = responseData.get(`${question.code}_${option.code}`) === 'Y';
                    const commentValue = responseData.get(`${question.code}_${option.code}_comment`) || '';

                    return (
                        <div key={option.id} className="option-with-comment">
                            <label className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handleCheckboxChange(option.code, e.target.checked)}
                                />
                                <span className="checkbox-label">{option.label}</span>
                            </label>
                            <div className="comment-field">
                                <input
                                    type="text"
                                    value={commentValue}
                                    onChange={(e) => handleCommentChange(option.code, e.target.value)}
                                    placeholder="Add comment..."
                                    className="comment-input"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .multiple-choice-comments-question {
                    margin: 1rem 0;
                }

                .options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .option-with-comment {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.5rem;
                    border-radius: 4px;
                    background: #fafaf9;
                    border: 1px solid #e0ddd8;
                }

                .checkbox-option {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    min-width: 200px;
                    flex-shrink: 0;
                }

                .checkbox-option input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .checkbox-label {
                    font-size: 0.95rem;
                    color: #333;
                }

                .comment-field {
                    flex: 1;
                }

                .comment-input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 0.875rem;
                    color: #333;
                    background: white;
                }

                .comment-input:focus {
                    outline: none;
                    border-color: #c94a4a;
                }

                .comment-input::placeholder {
                    color: #999;
                }

                @media (max-width: 768px) {
                    .option-with-comment {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }

                    .checkbox-option {
                        min-width: unset;
                    }

                    .comment-field {
                        width: 100%;
                    }

                    .comment-input {
                        font-size: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
