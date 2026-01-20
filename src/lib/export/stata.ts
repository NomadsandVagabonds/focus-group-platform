// Stata Export Library
// Generates Stata do-files for importing survey data
// Based on LimeSurvey's Stata export format

import type { SurveyWithStructure, Question, Subquestion, AnswerOption, ResponseWithData } from '@/lib/supabase/survey-types';

interface StataVariable {
    name: string;
    label: string;
    type: 'byte' | 'int' | 'long' | 'float' | 'double' | 'str';
    strWidth?: number;
    valueLabels?: Map<string, string>;
    valueLabelName?: string;
}

interface StataExportOptions {
    dataFilename?: string;
    noAnswerValue?: string;
    version?: 14 | 15 | 16 | 17; // Stata version
}

/**
 * Generate Stata-safe variable name from question code
 * Stata: max 32 chars, start with letter or _, alphanumeric + underscore
 */
function toStataVarName(code: string): string {
    let name = code.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    if (/^[0-9]/.test(name)) {
        name = '_' + name;
    }
    return name.substring(0, 32);
}

/**
 * Escape string for Stata
 */
function escapeStata(str: string): string {
    return str.replace(/`/g, "'").replace(/"/g, "'").replace(/\$/g, '').replace(/\n/g, ' ');
}

/**
 * Generate value label name for a question
 */
function valueLabelName(questionCode: string): string {
    return `lbl_${toStataVarName(questionCode)}`.substring(0, 32);
}

/**
 * Build variable definitions from survey structure
 */
function buildVariables(survey: SurveyWithStructure, options: StataExportOptions): StataVariable[] {
    const variables: StataVariable[] = [];

    // Response ID
    variables.push({
        name: 'responseid',
        label: 'Response ID',
        type: 'str',
        strWidth: 36,
    });

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
 * Get Stata variables for a single question
 */
function getVariablesForQuestion(
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] }
): StataVariable[] {
    const variables: StataVariable[] = [];
    const baseLabel = question.question_text.substring(0, 80);

    switch (question.question_type) {
        case 'text':
            variables.push({
                name: toStataVarName(question.code),
                label: baseLabel,
                type: 'str',
                strWidth: 244,
            });
            break;

        case 'long_text':
            variables.push({
                name: toStataVarName(question.code),
                label: baseLabel,
                type: 'str',
                strWidth: 2045,
            });
            break;

        case 'numerical':
            variables.push({
                name: toStataVarName(question.code),
                label: baseLabel,
                type: 'double',
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
                name: toStataVarName(question.code),
                label: baseLabel,
                type: 'byte',
                valueLabels,
                valueLabelName: valueLabelName(question.code),
            });
            break;

        case 'multiple_choice_multiple':
            for (const opt of question.answer_options) {
                variables.push({
                    name: toStataVarName(`${question.code}_${opt.code}`),
                    label: `${baseLabel} - ${opt.label}`.substring(0, 80),
                    type: 'byte',
                    valueLabels: new Map([['0', 'Not selected'], ['1', 'Selected']]),
                    valueLabelName: 'lbl_yesno',
                });
            }
            break;

        case 'array':
        case 'array_10_point':
        case 'array_yes_no_uncertain':
        case 'array_increase_same_decrease':
            const answerLabels = new Map<string, string>();
            for (const opt of question.answer_options.filter(o => o.scale_id === 0 || o.scale_id === null)) {
                answerLabels.set(opt.code, opt.label);
            }

            for (const subq of question.subquestions) {
                variables.push({
                    name: toStataVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 80),
                    type: 'byte',
                    valueLabels: answerLabels,
                    valueLabelName: valueLabelName(question.code),
                });
            }
            break;

        case 'array_dual_scale':
            const scale1Labels = new Map<string, string>();
            for (const opt of question.answer_options.filter(o => o.scale_id === 0 || o.scale_id === null)) {
                scale1Labels.set(opt.code, opt.label);
            }
            const scale2Labels = new Map<string, string>();
            for (const opt of question.answer_options.filter(o => o.scale_id === 1)) {
                scale2Labels.set(opt.code, opt.label);
            }

            for (const subq of question.subquestions) {
                variables.push({
                    name: toStataVarName(`${question.code}_${subq.code}_s1`),
                    label: `${baseLabel} - ${subq.label} (S1)`.substring(0, 80),
                    type: 'byte',
                    valueLabels: scale1Labels,
                    valueLabelName: valueLabelName(`${question.code}_s1`),
                });
                variables.push({
                    name: toStataVarName(`${question.code}_${subq.code}_s2`),
                    label: `${baseLabel} - ${subq.label} (S2)`.substring(0, 80),
                    type: 'byte',
                    valueLabels: scale2Labels,
                    valueLabelName: valueLabelName(`${question.code}_s2`),
                });
            }
            break;

        case 'array_numbers':
        case 'multiple_numerical':
            for (const subq of question.subquestions) {
                variables.push({
                    name: toStataVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 80),
                    type: 'double',
                });
            }
            break;

        case 'array_texts':
            for (const subq of question.subquestions) {
                variables.push({
                    name: toStataVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 80),
                    type: 'str',
                    strWidth: 244,
                });
            }
            break;

        case 'ranking':
            for (let i = 1; i <= question.subquestions.length; i++) {
                variables.push({
                    name: toStataVarName(`${question.code}_rank${i}`),
                    label: `${baseLabel} - Rank ${i}`.substring(0, 80),
                    type: 'str',
                    strWidth: 50,
                });
            }
            break;

        case 'date':
            variables.push({
                name: toStataVarName(question.code),
                label: baseLabel,
                type: 'str',
                strWidth: 10,
            });
            break;

        default:
            variables.push({
                name: toStataVarName(question.code),
                label: baseLabel,
                type: 'str',
                strWidth: 244,
            });
    }

    return variables;
}

/**
 * Generate Stata do-file content
 */
export function generateStataDoFile(
    survey: SurveyWithStructure,
    options: StataExportOptions = {}
): string {
    const variables = buildVariables(survey, options);
    const dataFilename = options.dataFilename || 'survey_data.csv';
    const version = options.version || 16;

    let dofile = '';

    // Header
    dofile += `* Stata Do-File for: ${escapeStata(survey.title)}\n`;
    dofile += `* Generated by Resonant Survey Platform\n`;
    dofile += `* Date: ${new Date().toISOString().split('T')[0]}\n`;
    dofile += `* Requires Stata ${version} or later\n\n`;

    // Clear and set version
    dofile += `clear all\n`;
    dofile += `set more off\n`;
    dofile += `version ${version}\n\n`;

    // Import CSV
    dofile += `* Import data\n`;
    dofile += `import delimited "${dataFilename}", varnames(1) stringcols(_all) clear\n\n`;

    // Convert string variables to appropriate types
    dofile += `* Convert variable types\n`;
    for (const v of variables) {
        if (v.type === 'byte' || v.type === 'int' || v.type === 'long') {
            dofile += `destring ${v.name}, replace force\n`;
        } else if (v.type === 'float' || v.type === 'double') {
            dofile += `destring ${v.name}, replace force\n`;
        }
    }
    dofile += `\n`;

    // Define value labels
    const uniqueValueLabels = new Map<string, Map<string, string>>();
    for (const v of variables) {
        if (v.valueLabels && v.valueLabelName) {
            if (!uniqueValueLabels.has(v.valueLabelName)) {
                uniqueValueLabels.set(v.valueLabelName, v.valueLabels);
            }
        }
    }

    // Add common value label for yes/no
    if ([...variables].some(v => v.valueLabelName === 'lbl_yesno')) {
        dofile += `* Define value labels\n`;
        dofile += `label define lbl_yesno 0 "Not selected" 1 "Selected"\n`;
    }

    for (const [labelName, labels] of uniqueValueLabels) {
        if (labelName === 'lbl_yesno') continue;
        dofile += `label define ${labelName} `;
        for (const [code, label] of labels) {
            const numCode = isNaN(Number(code)) ? 0 : Number(code);
            dofile += `${numCode} "${escapeStata(label)}" `;
        }
        dofile += `\n`;
    }
    dofile += `\n`;

    // Apply value labels
    dofile += `* Apply value labels\n`;
    for (const v of variables) {
        if (v.valueLabelName) {
            dofile += `label values ${v.name} ${v.valueLabelName}\n`;
        }
    }
    dofile += `\n`;

    // Variable labels
    dofile += `* Apply variable labels\n`;
    for (const v of variables) {
        dofile += `label variable ${v.name} "${escapeStata(v.label)}"\n`;
    }
    dofile += `\n`;

    // Compress and save
    dofile += `* Compress and save\n`;
    dofile += `compress\n`;
    dofile += `save "${survey.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.dta", replace\n\n`;

    // Summary
    dofile += `* View data summary\n`;
    dofile += `describe\n`;
    dofile += `summarize\n`;

    return dofile;
}

/**
 * Generate CSV data file for Stata import
 */
export function generateStataData(
    survey: SurveyWithStructure,
    responses: ResponseWithData[],
    options: StataExportOptions = {}
): string {
    const variables = buildVariables(survey, options);

    // Header row
    const headers = variables.map(v => v.name);
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';

    // Data rows
    for (const response of responses) {
        const row: string[] = [];

        // Build response data map
        const dataMap = new Map<string, string>();
        for (const rd of response.response_data) {
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

            const value = dataMap.get(v.name) || '';
            // Always quote for Stata CSV import
            row.push(`"${value.replace(/"/g, '""')}"`);
        }

        csv += row.join(',') + '\n';
    }

    return csv;
}

export type { StataVariable, StataExportOptions };
