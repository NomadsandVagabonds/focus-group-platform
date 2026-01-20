// Huge Free Text Question Component (LimeSurvey Type U)
// Extra large textarea for extended responses
'use client';

import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface HugeFreeTextQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function HugeFreeTextQuestion({ question, responseData, onAnswer }: HugeFreeTextQuestionProps) {
    const currentValue = responseData.get(question.code) || '';
    const settings = question.settings || {};

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onAnswer(question.code, e.target.value);
    };

    // Character count for max length validation
    const maxLength = settings.max_answers;
    const charCount = currentValue.length;

    return (
        <div className="huge-free-text-question">
            <textarea
                value={currentValue}
                onChange={handleChange}
                placeholder={settings.placeholder || 'Enter your response here...'}
                rows={15}
                maxLength={maxLength}
                className="huge-textarea"
            />
            {maxLength && (
                <div className="char-counter">
                    {charCount} / {maxLength} characters
                </div>
            )}

            <style jsx>{`
                .huge-free-text-question {
                    margin: 1rem 0;
                }

                .huge-textarea {
                    width: 100%;
                    min-height: 300px;
                    padding: 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    color: #333;
                    resize: vertical;
                    background: white;
                }

                .huge-textarea:focus {
                    outline: none;
                    border-color: #c94a4a;
                    box-shadow: 0 0 0 2px rgba(201, 74, 74, 0.1);
                }

                .huge-textarea::placeholder {
                    color: #999;
                }

                .char-counter {
                    text-align: right;
                    font-size: 0.8rem;
                    color: #666;
                    margin-top: 0.5rem;
                }

                @media (max-width: 768px) {
                    .huge-textarea {
                        min-height: 250px;
                        font-size: 16px;
                        padding: 0.875rem;
                    }
                }

                @media (max-width: 480px) {
                    .huge-textarea {
                        min-height: 200px;
                    }
                }
            `}</style>
        </div>
    );
}
