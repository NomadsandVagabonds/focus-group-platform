'use client';

import dynamic from 'next/dynamic';

// Dynamically import question preview renderers
// Maps AI assistant output types + database types to preview components
const previewComponents: Record<string, any> = {
    // Array types
    array: dynamic(() => import('./questions/ArrayQuestion')),
    array_5_point: dynamic(() => import('./questions/Array5PointQuestion')),
    array_dual_scale: dynamic(() => import('./questions/DualScaleArrayQuestion')),
    array_10_point: dynamic(() => import('./questions/TenPointArrayQuestion')),
    array_yes_no_uncertain: dynamic(() => import('./questions/YesNoUncertainArrayQuestion')),
    array_increase_same_decrease: dynamic(() => import('./questions/IncreaseSameDecreaseArrayQuestion')),

    // Choice types (AI assistant uses these names)
    list_radio: dynamic(() => import('./questions/ButtonSelectQuestion')),
    list_dropdown: dynamic(() => import('./questions/DropdownQuestion')),
    multiple_choice: dynamic(() => import('./questions/ButtonMultiSelectQuestion')),
    '5_point_choice': dynamic(() => import('./questions/FivePointChoiceQuestion')),
    five_point_choice: dynamic(() => import('./questions/FivePointChoiceQuestion')),

    // Database type names
    multiple_choice_single: dynamic(() => import('./questions/ButtonSelectQuestion')),
    multiple_choice_multiple: dynamic(() => import('./questions/ButtonMultiSelectQuestion')),
    dropdown: dynamic(() => import('./questions/DropdownQuestion')),
    button_select: dynamic(() => import('./questions/ButtonSelectQuestion')),
    button_multi_select: dynamic(() => import('./questions/ButtonMultiSelectQuestion')),

    // Text types
    text: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    textarea: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    long_text: dynamic(() => import('./questions/HugeFreeTextQuestion')),
    huge_free_text: dynamic(() => import('./questions/HugeFreeTextQuestion')),

    // Other common types
    ranking: dynamic(() => import('./questions/RankingQuestion')),
    numerical: dynamic(() => import('./questions/NumericalQuestion')),
    date: dynamic(() => import('./questions/DateQuestion')),
    yes_no: dynamic(() => import('./questions/YesNoQuestion')),
    slider: dynamic(() => import('./questions/SliderQuestion')),
    nps: dynamic(() => import('./questions/NPSQuestion')),
    csat: dynamic(() => import('./questions/CSATQuestion')),
    ces: dynamic(() => import('./questions/CESQuestion')),
};

interface QuestionPreviewProps {
    questionData: {
        code: string;
        question_text: string;
        question_type: string;
        settings?: any;
        subquestions?: Array<{ code: string; label: string }>;
        answer_options?: Array<{ code: string; label: string }>;
    };
    isModification?: boolean;
}

export default function QuestionPreview({ questionData, isModification }: QuestionPreviewProps) {
    const questionType = questionData.question_type?.toLowerCase() || 'text';
    const Component = previewComponents[questionType];

    // Create a mock question object that matches the expected shape
    const question = {
        id: 'preview',
        code: questionData.code || 'NEW',
        question_text: questionData.question_text || 'New question',
        question_type: questionType,
        settings: questionData.settings || {},
        subquestions: questionData.subquestions?.map((sq, i) => ({
            id: `sq-${i}`,
            code: sq.code,
            label: sq.label,
            order_index: i,
        })) || [],
        answer_options: questionData.answer_options?.map((ao, i) => ({
            id: `ao-${i}`,
            code: ao.code,
            label: ao.label,
            order_index: i,
        })) || [],
    };

    // Mock response data and handlers for preview
    const mockResponseData = new Map<string, any>();
    const mockOnAnswer = () => { }; // No-op for preview

    return (
        <div className="question-preview-container">
            <div className="preview-header">
                <span className="preview-badge">{isModification ? '✎ MODIFIED' : '✨ NEW'}</span>
                <span className="question-code">{question.code}</span>
            </div>

            <div className="preview-content">
                <div
                    className="question-text"
                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                />

                {Component ? (
                    <div className="preview-interaction" onClick={(e) => e.preventDefault()}>
                        <Component
                            question={question}
                            responseData={mockResponseData}
                            onAnswer={mockOnAnswer}
                            randomizationSeed="preview"
                        />
                    </div>
                ) : (
                    <div className="preview-placeholder">
                        Preview not available for type: {questionType}
                    </div>
                )}
            </div>

            <style jsx>{`
                .question-preview-container {
                    background: #fafafa;
                    border: 2px dashed #e0ddd8;
                    border-radius: 8px;
                    overflow: hidden;
                    margin: 12px 0;
                }

                .preview-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: #f5f3ef;
                    border-bottom: 1px solid #e0ddd8;
                }

                .preview-badge {
                    padding: 2px 8px;
                    background: #5cb85c;
                    color: white;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .preview-badge:first-child {
                    background: ${isModification ? '#f0ad4e' : '#5cb85c'};
                }

                .question-code {
                    font-size: 12px;
                    color: #666;
                    font-family: monospace;
                }

                .preview-content {
                    padding: 16px;
                    pointer-events: none;
                    opacity: 0.9;
                }

                .question-text {
                    font-size: 14px;
                    color: #333;
                    margin-bottom: 12px;
                    line-height: 1.5;
                }

                .preview-interaction {
                    transform: scale(0.9);
                    transform-origin: top left;
                }

                .preview-placeholder {
                    padding: 20px;
                    text-align: center;
                    color: #999;
                    font-size: 13px;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}
