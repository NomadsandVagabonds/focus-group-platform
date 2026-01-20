'use client';

import dynamic from 'next/dynamic';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

// Dynamically import all question components
const questionComponents: Record<string, any> = {
    array: dynamic(() => import('./questions/ArrayQuestion')),
    ranking: dynamic(() => import('./questions/RankingQuestion')),
    dropdown: dynamic(() => import('./questions/DropdownQuestion')),
    list_dropdown: dynamic(() => import('./questions/DropdownQuestion')),
    '!': dynamic(() => import('./questions/DropdownQuestion')),
    yes_no: dynamic(() => import('./questions/YesNoQuestion')),
    Y: dynamic(() => import('./questions/YesNoQuestion')),
    date: dynamic(() => import('./questions/DateQuestion')),
    D: dynamic(() => import('./questions/DateQuestion')),
    equation: dynamic(() => import('./questions/EquationQuestion')),
    '*': dynamic(() => import('./questions/EquationQuestion')),
    numerical: dynamic(() => import('./questions/NumericalQuestion')),
    N: dynamic(() => import('./questions/NumericalQuestion')),
    multiple_numerical: dynamic(() => import('./questions/MultipleNumericalQuestion')),
    K: dynamic(() => import('./questions/MultipleNumericalQuestion')),
    array_numbers: dynamic(() => import('./questions/ArrayNumbersQuestion')),
    array_texts: dynamic(() => import('./questions/ArrayTextsQuestion')),
    ';': dynamic(() => import('./questions/ArrayTextsQuestion')),
    dual_scale: dynamic(() => import('./questions/DualScaleArrayQuestion')),
    '1': dynamic(() => import('./questions/DualScaleArrayQuestion')),
    ten_point: dynamic(() => import('./questions/TenPointArrayQuestion')),
    B: dynamic(() => import('./questions/TenPointArrayQuestion')),
    yes_no_uncertain: dynamic(() => import('./questions/YesNoUncertainArrayQuestion')),
    C: dynamic(() => import('./questions/YesNoUncertainArrayQuestion')),
    increase_same_decrease: dynamic(() => import('./questions/IncreaseSameDecreaseArrayQuestion')),
    E: dynamic(() => import('./questions/IncreaseSameDecreaseArrayQuestion')),
    five_point: dynamic(() => import('./questions/Array5PointQuestion')),
    A: dynamic(() => import('./questions/Array5PointQuestion')),
    list_with_comment: dynamic(() => import('./questions/ListWithCommentQuestion')),
    O: dynamic(() => import('./questions/ListWithCommentQuestion')),
    multiple_choice_comments: dynamic(() => import('./questions/MultipleChoiceWithCommentsQuestion')),
    P: dynamic(() => import('./questions/MultipleChoiceWithCommentsQuestion')),
    five_point_choice: dynamic(() => import('./questions/FivePointChoiceQuestion')),
    '5': dynamic(() => import('./questions/FivePointChoiceQuestion')),
    long_text: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    U: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    T: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    multiple_short_text: dynamic(() => import('./questions/MultipleShortTextQuestion')),
    Q: dynamic(() => import('./questions/MultipleShortTextQuestion')),
    file_upload: dynamic(() => import('./questions/FileUploadQuestion')),
    '|': dynamic(() => import('./questions/FileUploadQuestion')),
    slider: dynamic(() => import('./questions/SliderQuestion')),
    gender: dynamic(() => import('./questions/GenderQuestion')),
    G: dynamic(() => import('./questions/GenderQuestion')),
    language: dynamic(() => import('./questions/LanguageSwitchQuestion')),
    I: dynamic(() => import('./questions/LanguageSwitchQuestion')),
    array_column: dynamic(() => import('./questions/ArrayColumnQuestion')),
    H: dynamic(() => import('./questions/ArrayColumnQuestion')),
    button_select: dynamic(() => import('./questions/ButtonSelectQuestion')),
    L: dynamic(() => import('./questions/ButtonSelectQuestion')),
    button_multi: dynamic(() => import('./questions/ButtonMultiSelectQuestion')),
    M: dynamic(() => import('./questions/ButtonMultiSelectQuestion')),
    image_select: dynamic(() => import('./questions/ImageSelectQuestion')),
    image_multi: dynamic(() => import('./questions/ImageMultiSelectQuestion')),
    nps: dynamic(() => import('./questions/NPSQuestion')),
    csat: dynamic(() => import('./questions/CSATQuestion')),
    ces: dynamic(() => import('./questions/CESQuestion')),
    // LimeSurvey codes
    F: dynamic(() => import('./questions/ArrayQuestion')),
    R: dynamic(() => import('./questions/RankingQuestion')),
    S: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    X: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    ':': dynamic(() => import('./questions/ArrayNumbersQuestion')),
};

interface QuestionLoaderProps {
    question: Question;
    responseData: Map<string, any>;
    onAnswer: (code: string, value: any, subCode?: string) => void;
    randomizationSeed: string;
    validationError?: string;
    responseId: string;
    questionNumber?: number;
    showQuestionCode?: boolean;
}

export default function QuestionLoader({
    question,
    responseData,
    onAnswer,
    randomizationSeed,
    validationError,
    responseId,
    questionNumber,
    showQuestionCode,
}: QuestionLoaderProps) {
    const QuestionComponent = questionComponents[question.type] || questionComponents['T'];

    if (!QuestionComponent) {
        return (
            <div style={{ padding: '1rem', border: '1px solid #ccc', margin: '1rem 0' }}>
                <p>Unknown question type: {question.type}</p>
            </div>
        );
    }

    const questionText = question.question_text || question.text || '';

    return (
        <div className="question-container">
            {/* Question label */}
            <div className="question-label">
                {questionNumber && <span className="question-number">Q{questionNumber}. </span>}
                <span
                    className="question-text"
                    dangerouslySetInnerHTML={{ __html: questionText }}
                />
                {question.mandatory && <span className="required-marker"> *</span>}
                {showQuestionCode && <span className="question-code"> [{question.code}]</span>}
            </div>

            {/* Help text */}
            {question.help_text && (
                <p className="help-text">{question.help_text}</p>
            )}

            {/* Validation error */}
            {validationError && (
                <div className="validation-error">{validationError}</div>
            )}

            {/* Question input */}
            <QuestionComponent
                question={question}
                value={responseData.get(question.code)}
                onChange={(value: any) => onAnswer(question.code, value)}
                subquestions={question.subquestions || []}
                answerOptions={question.answer_options || []}
                responseData={responseData}
                onSubquestionAnswer={(subCode: string, value: any) => onAnswer(question.code, value, subCode)}
                randomizationSeed={randomizationSeed}
                validationError={validationError}
                responseId={responseId}
                questionNumber={questionNumber}
                showQuestionCode={showQuestionCode}
            />

            <style jsx>{`
                .question-container {
                    margin-bottom: 1rem;
                }
                .question-label {
                    font-size: 1.1rem;
                    font-weight: 500;
                    margin-bottom: 0.75rem;
                    color: #1a1d24;
                    line-height: 1.5;
                }
                .question-number {
                    color: #666;
                }
                .required-marker {
                    color: #c94a4a;
                }
                .question-code {
                    font-size: 0.75rem;
                    color: #999;
                    font-family: monospace;
                }
                .help-text {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 0.75rem;
                    font-style: italic;
                }
                .validation-error {
                    color: #c94a4a;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                    padding: 0.5rem;
                    background: #fff5f5;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}
