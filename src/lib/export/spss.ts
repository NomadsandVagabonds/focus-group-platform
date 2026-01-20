// SPSS Export Library
// Generates SPSS syntax files (.sps) for importing survey data
// Based on LimeSurvey's SPSS export format

import type { SurveyWithStructure, Question, Subquestion, AnswerOption, ResponseWithData } from '@/lib/supabase/survey-types';

interface SPSSVariable {
    name: string;
    label: string;
    type: 'numeric' | 'string';
    width: number;
    decimals: number;
    valueLabels?: Map<string, string>;
}

interface SPSSExportOptions {
    dataFilename?: string;
    noAnswerValue?: string;
    includeResponseId?: boolean;
    includeTiming?: boolean;
}

/**
 * Generate SPSS variable name from question code
 * SPSS variable names: max 64 chars, start with letter, alphanumeric + underscore
 */
function toSPSSVarName(code: string): string {
    let name = code.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z]/.test(name)) {
        name = 'v_' + name;
    }
    return name.substring(0, 64);
}

/**
 * Escape string for SPSS syntax
 */
function escapeSPSS(str: string): string {
    return str.replace(/'/g, "''").replace(/\n/g, ' ');
}

/**
 * Build variable definitions from survey structure
 */
function buildVariables(survey: SurveyWithStructure, options: SPSSExportOptions): SPSSVariable[] {
    const variables: SPSSVariable[] = [];

    // Response ID
    if (options.includeResponseId !== false) {
        variables.push({
            name: 'responseid',
            label: 'Response ID',
            type: 'string',
            width: 36,
            decimals: 0,
        });
    }

    // Iterate through questions
    for (const group of survey.question_groups) {
        for (const question of group.questions) {
            const vars = getVariablesForQuestion(question);
            variables.push(...vars);
        }
    }

    return variables;
}

/**
 * Get SPSS variables for a single question
 */
function getVariablesForQuestion(
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] }
): SPSSVariable[] {
    const variables: SPSSVariable[] = [];
    const baseLabel = question.question_text.substring(0, 120);

    switch (question.question_type) {
        case 'text':
        case 'long_text':
            variables.push({
                name: toSPSSVarName(question.code),
                label: baseLabel,
                type: 'string',
                width: question.question_type === 'long_text' ? 2000 : 255,
                decimals: 0,
            });
            break;

        case 'numerical':
            variables.push({
                name: toSPSSVarName(question.code),
                label: baseLabel,
                type: 'numeric',
                width: 12,
                decimals: question.settings.decimal_places || 2,
            });
            break;

        case 'multiple_choice_single':
        case 'dropdown':
        case 'yes_no':
            const valueLabels = new Map<string, string>();
            for (const opt of question.answer_options) {
                valueLabels.set(opt.code, opt.label);
            }
            variables.push({
                name: toSPSSVarName(question.code),
                label: baseLabel,
                type: 'numeric',
                width: 8,
                decimals: 0,
                valueLabels,
            });
            break;

        case 'multiple_choice_multiple':
            // Each option becomes its own binary variable
            for (const opt of question.answer_options) {
                variables.push({
                    name: toSPSSVarName(`${question.code}_${opt.code}`),
                    label: `${baseLabel} - ${opt.label}`.substring(0, 120),
                    type: 'numeric',
                    width: 1,
                    decimals: 0,
                    valueLabels: new Map([['0', 'Not selected'], ['1', 'Selected']]),
                });
            }
            break;

        case 'array':
        case 'array_dual_scale':
        case 'array_10_point':
        case 'array_yes_no_uncertain':
        case 'array_increase_same_decrease':
            // Each subquestion becomes a variable
            const answerLabels = new Map<string, string>();
            for (const opt of question.answer_options.filter(o => o.scale_id === 0 || o.scale_id === null)) {
                answerLabels.set(opt.code, opt.label);
            }

            for (const subq of question.subquestions) {
                if (question.question_type === 'array_dual_scale') {
                    // Two variables per subquestion for dual scale
                    variables.push({
                        name: toSPSSVarName(`${question.code}_${subq.code}_scale1`),
                        label: `${baseLabel} - ${subq.label} (Scale 1)`.substring(0, 120),
                        type: 'numeric',
                        width: 8,
                        decimals: 0,
                        valueLabels: answerLabels,
                    });

                    const scale2Labels = new Map<string, string>();
                    for (const opt of question.answer_options.filter(o => o.scale_id === 1)) {
                        scale2Labels.set(opt.code, opt.label);
                    }
                    variables.push({
                        name: toSPSSVarName(`${question.code}_${subq.code}_scale2`),
                        label: `${baseLabel} - ${subq.label} (Scale 2)`.substring(0, 120),
                        type: 'numeric',
                        width: 8,
                        decimals: 0,
                        valueLabels: scale2Labels,
                    });
                } else {
                    variables.push({
                        name: toSPSSVarName(`${question.code}_${subq.code}`),
                        label: `${baseLabel} - ${subq.label}`.substring(0, 120),
                        type: 'numeric',
                        width: 8,
                        decimals: 0,
                        valueLabels: answerLabels,
                    });
                }
            }
            break;

        case 'array_numbers':
        case 'multiple_numerical':
            for (const subq of question.subquestions) {
                variables.push({
                    name: toSPSSVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 120),
                    type: 'numeric',
                    width: 12,
                    decimals: question.settings.decimal_places || 2,
                });
            }
            break;

        case 'array_texts':
            for (const subq of question.subquestions) {
                variables.push({
                    name: toSPSSVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 120),
                    type: 'string',
                    width: 255,
                    decimals: 0,
                });
            }
            break;

        case 'ranking':
            // Each rank position becomes a variable
            for (let i = 1; i <= question.subquestions.length; i++) {
                variables.push({
                    name: toSPSSVarName(`${question.code}_rank${i}`),
                    label: `${baseLabel} - Rank ${i}`.substring(0, 120),
                    type: 'string',
                    width: 50,
                    decimals: 0,
                });
            }
            break;

        case 'date':
            variables.push({
                name: toSPSSVarName(question.code),
                label: baseLabel,
                type: 'string',
                width: 10,
                decimals: 0,
            });
            break;

        default:
            // Fallback for unknown types
            variables.push({
                name: toSPSSVarName(question.code),
                label: baseLabel,
                type: 'string',
                width: 255,
                decimals: 0,
            });
    }

    return variables;
}

/**
 * Generate SPSS syntax file content
 */
export function generateSPSSSyntax(
    survey: SurveyWithStructure,
    options: SPSSExportOptions = {}
): string {
    const variables = buildVariables(survey, options);
    const dataFilename = options.dataFilename || 'survey_data.csv';

    let syntax = '';

    // Header
    syntax += `* SPSS Syntax File for: ${escapeSPSS(survey.title)}.\n`;
    syntax += `* Generated by Resonant Survey Platform.\n`;
    syntax += `* Date: ${new Date().toISOString().split('T')[0]}.\n\n`;

    // GET DATA command for CSV
    syntax += `GET DATA\n`;
    syntax += `  /TYPE=TXT\n`;
    syntax += `  /FILE='${dataFilename}'\n`;
    syntax += `  /ENCODING='UTF8'\n`;
    syntax += `  /DELIMITERS=","\n`;
    syntax += `  /QUALIFIER='"'\n`;
    syntax += `  /ARRANGEMENT=DELIMITED\n`;
    syntax += `  /FIRSTCASE=2\n`;
    syntax += `  /VARIABLES=\n`;

    // Variable definitions
    for (const v of variables) {
        const typeStr = v.type === 'numeric'
            ? `F${v.width}.${v.decimals}`
            : `A${v.width}`;
        syntax += `    ${v.name} ${typeStr}\n`;
    }
    syntax += `.\n\n`;

    // Variable labels
    syntax += `VARIABLE LABELS\n`;
    for (const v of variables) {
        syntax += `  ${v.name} '${escapeSPSS(v.label)}'\n`;
    }
    syntax += `.\n\n`;

    // Value labels
    const varsWithLabels = variables.filter(v => v.valueLabels && v.valueLabels.size > 0);
    if (varsWithLabels.length > 0) {
        syntax += `VALUE LABELS\n`;
        for (const v of varsWithLabels) {
            syntax += `  ${v.name}\n`;
            for (const [code, label] of v.valueLabels!) {
                // Try to use numeric code if possible
                const numCode = isNaN(Number(code)) ? `'${code}'` : code;
                syntax += `    ${numCode} '${escapeSPSS(label)}'\n`;
            }
        }
        syntax += `.\n\n`;
    }

    // Missing values
    if (options.noAnswerValue) {
        syntax += `MISSING VALUES ALL (${options.noAnswerValue}).\n\n`;
    }

    // Execute
    syntax += `EXECUTE.\n`;

    return syntax;
}

/**
 * Generate CSV data file for SPSS import
 */
export function generateSPSSData(
    survey: SurveyWithStructure,
    responses: ResponseWithData[],
    options: SPSSExportOptions = {}
): string {
    const variables = buildVariables(survey, options);
    const noAnswerValue = options.noAnswerValue || '';

    // Header row
    const headers = variables.map(v => v.name);
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';

    // Data rows
    for (const response of responses) {
        const row: string[] = [];

        // Build a map of response data for quick lookup
        const dataMap = new Map<string, string>();
        for (const rd of response.response_data) {
            // Handle the key based on question structure
            const key = rd.subquestion_id
                ? `${rd.question_id}_${rd.subquestion_id}`
                : rd.question_id;
            dataMap.set(key, rd.value);
        }

        for (const v of variables) {
            if (v.name === 'responseid') {
                row.push(`"${response.id}"`);
                continue;
            }

            const value = dataMap.get(v.name) || noAnswerValue;

            if (v.type === 'string') {
                // Escape quotes in strings
                row.push(`"${value.replace(/"/g, '""')}"`);
            } else {
                // Numeric - leave empty or use value
                row.push(value === '' ? noAnswerValue : value);
            }
        }

        csv += row.join(',') + '\n';
    }

    return csv;
}

export type { SPSSVariable, SPSSExportOptions };
