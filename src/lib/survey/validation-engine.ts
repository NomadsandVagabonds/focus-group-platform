// Validation Engine - Response validation with regex, min/max, and skip patterns
// Part of Agent 5: Response Validation

import type { Question, QuestionSettings } from '@/lib/supabase/survey-types';

export interface ValidationResult {
    valid: boolean;
    error?: string;
    skipTo?: string; // Question code to skip to on validation failure
}

export interface ValidationContext {
    responseData: Map<string, any>;
    allQuestions: Question[];
}

export class ValidationEngine {
    /**
     * Validate a response value against question settings
     */
    static validate(
        question: Question,
        value: any,
        subquestionCode?: string,
        context?: ValidationContext
    ): ValidationResult {
        const settings = question.settings;

        // Skip validation if value is empty and not mandatory
        if ((value === undefined || value === null || value === '') && !settings.mandatory) {
            return { valid: true };
        }

        // Mandatory check
        if (settings.mandatory && (value === undefined || value === null || value === '')) {
            // For array questions, the main value is often empty/unused as we validate subquestions individually
            const arrayTypes = [
                'array',
                'array_numbers',
                'array_texts',
                'array_5point',
                'array_10point',
                'array_yes_no_uncertain',
                'array_increase_same_decrease',
                'array_column'
            ];

            if (arrayTypes.includes(question.question_type)) {
                return { valid: true };
            }

            return {
                valid: false,
                error: 'This question requires an answer.',
            };
        }

        // Type-specific validation
        switch (question.question_type) {
            case 'numerical':
            case 'multiple_numerical':
            case 'array_numbers':
                return this.validateNumerical(value, settings);

            case 'text':
            case 'long_text':
                return this.validateText(value, settings);

            case 'multiple_choice_multiple':
                return this.validateMultipleChoice(value, settings);

            case 'date':
                return this.validateDate(value, settings);

            default:
                // Apply regex validation if configured
                if (settings.validation_regex) {
                    return this.validateRegex(value, settings);
                }
                return { valid: true };
        }
    }

    /**
     * Validate numerical values
     */
    private static validateNumerical(value: any, settings: QuestionSettings): ValidationResult {
        const numValue = parseFloat(value);

        if (isNaN(numValue)) {
            return {
                valid: false,
                error: settings.validation_message || 'Please enter a valid number.',
            };
        }

        if (settings.min_value !== undefined && numValue < settings.min_value) {
            return {
                valid: false,
                error: settings.validation_message || `Value must be at least ${settings.min_value}.`,
            };
        }

        if (settings.max_value !== undefined && numValue > settings.max_value) {
            return {
                valid: false,
                error: settings.validation_message || `Value must be at most ${settings.max_value}.`,
            };
        }

        return { valid: true };
    }

    /**
     * Validate text values with regex
     */
    private static validateText(value: any, settings: QuestionSettings): ValidationResult {
        const strValue = String(value);

        // Apply regex if configured
        if (settings.validation_regex) {
            return this.validateRegex(strValue, settings);
        }

        return { valid: true };
    }

    /**
     * Validate regex pattern
     */
    private static validateRegex(value: any, settings: QuestionSettings): ValidationResult {
        if (!settings.validation_regex) {
            return { valid: true };
        }

        try {
            const regex = new RegExp(settings.validation_regex);
            if (!regex.test(String(value))) {
                return {
                    valid: false,
                    error: settings.validation_message || 'Please enter a valid value.',
                };
            }
        } catch (e) {
            console.error('Invalid regex pattern:', settings.validation_regex, e);
            // If regex is invalid, allow the value
            return { valid: true };
        }

        return { valid: true };
    }

    /**
     * Validate multiple choice answers (min/max selections)
     */
    private static validateMultipleChoice(value: any, settings: QuestionSettings): ValidationResult {
        const selections = Array.isArray(value) ? value : value ? [value] : [];
        const count = selections.filter(v => v && v !== '').length;

        if (settings.min_answers !== undefined && count < settings.min_answers) {
            return {
                valid: false,
                error: settings.validation_message || `Please select at least ${settings.min_answers} option(s).`,
            };
        }

        if (settings.max_answers !== undefined && count > settings.max_answers) {
            return {
                valid: false,
                error: settings.validation_message || `Please select at most ${settings.max_answers} option(s).`,
            };
        }

        return { valid: true };
    }

    /**
     * Validate date values
     */
    private static validateDate(value: any, settings: QuestionSettings): ValidationResult {
        if (!value) {
            return { valid: true };
        }

        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return {
                valid: false,
                error: settings.validation_message || 'Please enter a valid date.',
            };
        }

        return { valid: true };
    }

    /**
     * Validate all responses for a question group
     */
    static validateGroup(
        questions: Question[],
        responseData: Map<string, any>
    ): Map<string, ValidationResult> {
        const results = new Map<string, ValidationResult>();

        for (const question of questions) {
            if (question.question_type === 'text_display' || question.question_type === 'equation') {
                continue; // Skip display-only questions
            }

            const value = responseData.get(question.code);
            const result = this.validate(question, value);

            if (!result.valid) {
                results.set(question.code, result);
            }

            // For array questions, validate each subquestion
            if (['array', 'array_numbers', 'array_texts'].includes(question.question_type)) {
                const questionWithSubs = question as Question & { subquestions?: any[] };
                if (questionWithSubs.subquestions) {
                    for (const subq of questionWithSubs.subquestions) {
                        const subValue = responseData.get(`${question.code}_${subq.code}`);
                        if (question.settings.mandatory && (!subValue || subValue === '')) {
                            results.set(`${question.code}_${subq.code}`, {
                                valid: false,
                                error: 'This row requires an answer.',
                            });
                        }
                    }
                }
            }
        }

        return results;
    }

    /**
     * Check if a skip pattern should be applied based on validation
     */
    static checkSkipPattern(
        question: Question,
        value: any,
        allQuestions: Question[]
    ): string | null {
        // Skip patterns can be defined in question metadata
        const skipPatterns = question.settings.skip_patterns as Array<{
            condition: string;
            skipTo: string;
        }> | undefined;

        if (!skipPatterns) {
            return null;
        }

        for (const pattern of skipPatterns) {
            if (this.evaluateSkipCondition(pattern.condition, value)) {
                return pattern.skipTo;
            }
        }

        return null;
    }

    /**
     * Evaluate a skip condition
     */
    private static evaluateSkipCondition(condition: string, value: any): boolean {
        // Simple condition evaluation
        // Supports: "== value", "!= value", "> value", "< value", "empty", "not_empty"
        const strValue = String(value ?? '');

        if (condition === 'empty') {
            return value === undefined || value === null || value === '';
        }

        if (condition === 'not_empty') {
            return value !== undefined && value !== null && value !== '';
        }

        const match = condition.match(/^(==|!=|>|<|>=|<=)\s*(.+)$/);
        if (match) {
            const [, operator, compareValue] = match;
            const trimmedCompare = compareValue.trim().replace(/^['"]|['"]$/g, '');

            switch (operator) {
                case '==':
                    return strValue === trimmedCompare;
                case '!=':
                    return strValue !== trimmedCompare;
                case '>':
                    return parseFloat(strValue) > parseFloat(trimmedCompare);
                case '<':
                    return parseFloat(strValue) < parseFloat(trimmedCompare);
                case '>=':
                    return parseFloat(strValue) >= parseFloat(trimmedCompare);
                case '<=':
                    return parseFloat(strValue) <= parseFloat(trimmedCompare);
            }
        }

        return false;
    }
}

// Common validation patterns
export const ValidationPatterns = {
    EMAIL: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    PHONE_US: '^\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$',
    PHONE_INTL: '^\\+?[1-9]\\d{1,14}$',
    ZIP_US: '^\\d{5}(-\\d{4})?$',
    URL: '^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$',
    INTEGER: '^-?\\d+$',
    DECIMAL: '^-?\\d*\\.?\\d+$',
    ALPHA_ONLY: '^[a-zA-Z]+$',
    ALPHANUMERIC: '^[a-zA-Z0-9]+$',
};

export default ValidationEngine;
