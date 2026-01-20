'use client';

import dynamic from 'next/dynamic';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

// Dynamically import all question components
const questionComponents: Record<string, any> = {
    // Full type names (from database)
    array: dynamic(() => import('./questions/ArrayQuestion')),
    array_5_point: dynamic(() => import('./questions/Array5PointQuestion')),
    array_dual_scale: dynamic(() => import('./questions/DualScaleArrayQuestion')),
    array_10_point: dynamic(() => import('./questions/TenPointArrayQuestion')),
    array_yes_no_uncertain: dynamic(() => import('./questions/YesNoUncertainArrayQuestion')),
    array_increase_same_decrease: dynamic(() => import('./questions/IncreaseSameDecreaseArrayQuestion')),
    array_numbers: dynamic(() => import('./questions/ArrayNumbersQuestion')),
    array_texts: dynamic(() => import('./questions/ArrayTextsQuestion')),
    array_column: dynamic(() => import('./questions/ArrayColumnQuestion')),
    ranking: dynamic(() => import('./questions/RankingQuestion')),
    dropdown: dynamic(() => import('./questions/DropdownQuestion')),
    list_dropdown: dynamic(() => import('./questions/DropdownQuestion')),
    yes_no: dynamic(() => import('./questions/YesNoQuestion')),
    date: dynamic(() => import('./questions/DateQuestion')),
    equation: dynamic(() => import('./questions/EquationQuestion')),
    numerical: dynamic(() => import('./questions/NumericalQuestion')),
    multiple_numerical: dynamic(() => import('./questions/MultipleNumericalQuestion')),
    text: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    long_text: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    huge_free_text: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    text_display: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    multiple_short_text: dynamic(() => import('./questions/MultipleShortTextQuestion')),
    list_with_comment: dynamic(() => import('./questions/ListWithCommentQuestion')),
    multiple_choice_with_comments: dynamic(() => import('./questions/MultipleChoiceWithCommentsQuestion')),
    multiple_choice_single: dynamic(() => import('./questions/ButtonSelectQuestion')),
    multiple_choice_multiple: dynamic(() => import('./questions/ButtonMultiSelectQuestion')),
    five_point_choice: dynamic(() => import('./questions/FivePointChoiceQuestion')),
    file_upload: dynamic(() => import('./questions/FileUploadQuestion')),
    slider: dynamic(() => import('./questions/SliderQuestion')),
    gender: dynamic(() => import('./questions/GenderQuestion')),
    language_switch: dynamic(() => import('./questions/LanguageSwitchQuestion')),
    button_select: dynamic(() => import('./questions/ButtonSelectQuestion')),
    button_multi_select: dynamic(() => import('./questions/ButtonMultiSelectQuestion')),
    image_select: dynamic(() => import('./questions/ImageSelectQuestion')),
    image_multi_select: dynamic(() => import('./questions/ImageMultiSelectQuestion')),
    nps: dynamic(() => import('./questions/NPSQuestion')),
    csat: dynamic(() => import('./questions/CSATQuestion')),
    ces: dynamic(() => import('./questions/CESQuestion')),
    // LimeSurvey short codes
    '!': dynamic(() => import('./questions/DropdownQuestion')),
    Y: dynamic(() => import('./questions/YesNoQuestion')),
    D: dynamic(() => import('./questions/DateQuestion')),
    '*': dynamic(() => import('./questions/EquationQuestion')),
    N: dynamic(() => import('./questions/NumericalQuestion')),
    K: dynamic(() => import('./questions/MultipleNumericalQuestion')),
    ';': dynamic(() => import('./questions/ArrayTextsQuestion')),
    '1': dynamic(() => import('./questions/DualScaleArrayQuestion')),
    B: dynamic(() => import('./questions/TenPointArrayQuestion')),
    C: dynamic(() => import('./questions/YesNoUncertainArrayQuestion')),
    E: dynamic(() => import('./questions/IncreaseSameDecreaseArrayQuestion')),
    A: dynamic(() => import('./questions/Array5PointQuestion')),
    O: dynamic(() => import('./questions/ListWithCommentQuestion')),
    P: dynamic(() => import('./questions/MultipleChoiceWithCommentsQuestion')),
    '5': dynamic(() => import('./questions/FivePointChoiceQuestion')),
    U: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    T: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    S: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    X: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    Q: dynamic(() => import('./questions/MultipleShortTextQuestion')),
    '|': dynamic(() => import('./questions/FileUploadQuestion')),
    G: dynamic(() => import('./questions/GenderQuestion')),
    I: dynamic(() => import('./questions/LanguageSwitchQuestion')),
    H: dynamic(() => import('./questions/ArrayColumnQuestion')),
    L: dynamic(() => import('./questions/ButtonSelectQuestion')),
    M: dynamic(() => import('./questions/ButtonMultiSelectQuestion')),
    F: dynamic(() => import('./questions/ArrayQuestion')),
    R: dynamic(() => import('./questions/RankingQuestion')),
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
    const questionType = question.question_type || question.type || 'T';
    const QuestionComponent = questionComponents[questionType] || questionComponents['T'];

    if (!QuestionComponent) {
        return (
            <div style={{ padding: '1rem', border: '1px solid #ccc', margin: '1rem 0' }}>
                <p>Unknown question type: {questionType}</p>
            </div>
        );
    }

    const questionText = question.question_text || question.text || '';
    const settings = question.settings || {};

    // Hide equation questions or questions with hidden setting
    if (questionType === 'equation' || questionType === '*' || settings.hidden) {
        return null;
    }

    return (
        <div className="question-container">
            {/* Question label */}
            <div className="question-label">
                {question.mandatory && <span className="required-marker">* </span>}
                {questionNumber && <span className="question-number">{questionNumber} </span>}
                <span
                    className="question-text"
                    dangerouslySetInnerHTML={{ __html: questionText }}
                />
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
                onAnswer={(code: string, value: any, subCode?: string) => onAnswer(code, value, subCode)}
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
                    font-weight: bold;
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
