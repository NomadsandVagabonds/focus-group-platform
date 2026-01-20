// Equation Question Component (Hidden Calculation)
'use client';

import { useEffect } from 'react';
import type { Question, Subquestion, AnswerOption } from '@/lib/supabase/survey-types';

interface EquationQuestionProps {
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] };
    responseData: Map<string, any>;
    onAnswer: (questionCode: string, value: any, subquestionCode?: string) => void;
}

export default function EquationQuestion({ question, responseData, onAnswer }: EquationQuestionProps) {
    // Equation questions perform calculations based on other question responses
    // The equation is stored in the help_text field (LimeSurvey convention)
    // e.g., "{Q1} + {Q2}" or "({Q1} * 100) / {Q2}"

    const settings = question.settings || {};

    useEffect(() => {
        const equation = question.help_text || '';
        if (!equation) return;

        try {
            // Replace question references {Qx} with their values
            let expression = equation;
            const questionRefs = equation.match(/\{([^}]+)\}/g) || [];

            for (const ref of questionRefs) {
                const questionCode = ref.slice(1, -1); // Remove { and }
                const value = responseData.get(questionCode);

                if (value === undefined || value === null || value === '') {
                    // If any referenced question has no value, don't calculate
                    return;
                }

                // Convert to number for calculation
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    return;
                }

                expression = expression.replace(ref, numValue.toString());
            }

            // Safely evaluate the mathematical expression
            // Only allow numbers, operators, and parentheses
            const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
            if (sanitized !== expression) {
                console.warn('Equation contained invalid characters:', equation);
                return;
            }

            // Use Function constructor for safe math evaluation
            const result = new Function(`return (${sanitized})`)();

            if (typeof result === 'number' && !isNaN(result)) {
                const currentValue = responseData.get(question.code);
                const roundedResult = Math.round(result * 100) / 100; // Round to 2 decimal places

                if (currentValue !== roundedResult) {
                    onAnswer(question.code, roundedResult);
                }
            }
        } catch (error) {
            console.error('Error evaluating equation:', error);
        }
    }, [question, responseData, onAnswer]);

    // Equation questions are hidden by default
    // Only show if explicitly configured to display
    if (!settings.hide_tip) {
        return null;
    }

    // If shown (for debugging), display the calculated value
    const currentValue = responseData.get(question.code);

    return (
        <div className="equation-question">
            <div className="equation-display">
                <span className="equation-label">Calculated value:</span>
                <span className="equation-value">{currentValue ?? '-'}</span>
            </div>

            <style jsx>{`
                .equation-question {
                    padding: 0.75rem;
                    background: #f5f3ef;
                    border-radius: 4px;
                    border: 1px dashed #e0ddd8;
                }

                .equation-display {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .equation-label {
                    font-size: 0.875rem;
                    color: #666;
                }

                .equation-value {
                    font-weight: 600;
                    color: #1a1d24;
                }
            `}</style>
        </div>
    );
}
