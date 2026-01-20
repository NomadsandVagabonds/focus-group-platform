// List with Comment Question Component (LimeSurvey Type O)
// Radio buttons with an additional text comment field
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface ListWithCommentQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function ListWithCommentQuestion({ question, responseData, onAnswer }: ListWithCommentQuestionProps) {
    const answerOptions = question.answer_options.sort((a, b) => a.order_index - b.order_index);
    const currentValue = responseData.get(question.code) || '';
    const commentValue = responseData.get(`${question.code}_comment`) || '';

    const handleRadioChange = (value: string) => {
        onAnswer(question.code, value);
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onAnswer(question.code, e.target.value, 'comment');
    };

    return (
        <div className="list-with-comment-question">
            <div className="radio-group">
                {answerOptions.map(option => (
                    <label key={option.id} className="radio-option">
                        <input
                            type="radio"
                            name={question.code}
                            value={option.code}
                            checked={currentValue === option.code}
                            onChange={() => handleRadioChange(option.code)}
                        />
                        <span className="radio-label">{option.label}</span>
                    </label>
                ))}
            </div>

            <div className="comment-section">
                <label className="comment-label">
                    {question.settings.placeholder || 'Please add a comment (optional)'}
                </label>
                <textarea
                    value={commentValue}
                    onChange={handleCommentChange}
                    placeholder="Enter your comment here..."
                    rows={3}
                    className="comment-input"
                />
            </div>

            <style jsx>{`
                .list-with-comment-question {
                    margin: 1rem 0;
                }

                .radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                }

                .radio-option {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background-color 0.15s ease;
                }

                .radio-option:hover {
                    background-color: #f5f3ef;
                }

                .radio-option input[type="radio"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .radio-label {
                    font-size: 0.95rem;
                    color: #333;
                }

                .comment-section {
                    border-top: 1px solid #e0ddd8;
                    padding-top: 1rem;
                }

                .comment-label {
                    display: block;
                    font-size: 0.875rem;
                    color: #666;
                    margin-bottom: 0.5rem;
                }

                .comment-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 0.95rem;
                    color: #333;
                    resize: vertical;
                    min-height: 80px;
                }

                .comment-input:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 2px rgba(201, 74, 74, 0.1);
                }

                .comment-input::placeholder {
                    color: #999;
                }

                @media (max-width: 768px) {
                    .radio-option {
                        padding: 0.75rem 0.5rem;
                    }

                    .comment-input {
                        font-size: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
