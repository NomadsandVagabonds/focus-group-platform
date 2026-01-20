// R Export Library
// Generates R script files for importing survey data
// Based on LimeSurvey's R export format

import type { SurveyWithStructure, Question, Subquestion, AnswerOption, ResponseWithData } from '@/lib/supabase/survey-types';

interface RVariable {
    name: string;
    label: string;
    type: 'numeric' | 'character' | 'factor';
    levels?: { code: string; label: string }[];
}

interface RExportOptions {
    dataFilename?: string;
    noAnswerValue?: string;
    useHaven?: boolean; // Use haven package for labeled data
}

/**
 * Generate R-safe variable name from question code
 */
function toRVarName(code: string): string {
    let name = code.replace(/[^a-zA-Z0-9_.]/g, '_');
    if (/^[0-9]/.test(name)) {
        name = 'v_' + name;
    }
    // R reserved words
    const reserved = ['if', 'else', 'repeat', 'while', 'function', 'for', 'in', 'next', 'break', 'TRUE', 'FALSE', 'NULL', 'Inf', 'NaN', 'NA'];
    if (reserved.includes(name)) {
        name = 'v_' + name;
    }
    return name;
}

/**
 * Escape string for R
 */
function escapeR(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/**
 * Build variable definitions from survey structure
 */
function buildVariables(survey: SurveyWithStructure, options: RExportOptions): RVariable[] {
    const variables: RVariable[] = [];

    // Response ID
    variables.push({
        name: 'response_id',
        label: 'Response ID',
        type: 'character',
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
 * Get R variables for a single question
 */
function getVariablesForQuestion(
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] }
): RVariable[] {
    const variables: RVariable[] = [];
    const baseLabel = question.question_text.substring(0, 200);

    switch (question.question_type) {
        case 'text':
        case 'long_text':
        case 'date':
            variables.push({
                name: toRVarName(question.code),
                label: baseLabel,
                type: 'character',
            });
            break;

        case 'numerical':
            variables.push({
                name: toRVarName(question.code),
                label: baseLabel,
                type: 'numeric',
            });
            break;

        case 'multiple_choice_single':
        case 'dropdown':
        case 'yes_no':
            variables.push({
                name: toRVarName(question.code),
                label: baseLabel,
                type: 'factor',
                levels: question.answer_options.map(opt => ({
                    code: opt.code,
                    label: opt.label,
                })),
            });
            break;

        case 'multiple_choice_multiple':
            for (const opt of question.answer_options) {
                variables.push({
                    name: toRVarName(`${question.code}_${opt.code}`),
                    label: `${baseLabel} - ${opt.label}`.substring(0, 200),
                    type: 'factor',
                    levels: [
                        { code: '0', label: 'Not selected' },
                        { code: '1', label: 'Selected' },
                    ],
                });
            }
            break;

        case 'array':
        case 'array_10_point':
        case 'array_yes_no_uncertain':
        case 'array_increase_same_decrease':
            const answerLevels = question.answer_options
                .filter(o => o.scale_id === 0 || o.scale_id === null)
                .map(opt => ({ code: opt.code, label: opt.label }));

            for (const subq of question.subquestions) {
                variables.push({
                    name: toRVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 200),
                    type: 'factor',
                    levels: answerLevels,
                });
            }
            break;

        case 'array_dual_scale':
            const scale1Levels = question.answer_options
                .filter(o => o.scale_id === 0 || o.scale_id === null)
                .map(opt => ({ code: opt.code, label: opt.label }));
            const scale2Levels = question.answer_options
                .filter(o => o.scale_id === 1)
                .map(opt => ({ code: opt.code, label: opt.label }));

            for (const subq of question.subquestions) {
                variables.push({
                    name: toRVarName(`${question.code}_${subq.code}_scale1`),
                    label: `${baseLabel} - ${subq.label} (Scale 1)`.substring(0, 200),
                    type: 'factor',
                    levels: scale1Levels,
                });
                variables.push({
                    name: toRVarName(`${question.code}_${subq.code}_scale2`),
                    label: `${baseLabel} - ${subq.label} (Scale 2)`.substring(0, 200),
                    type: 'factor',
                    levels: scale2Levels,
                });
            }
            break;

        case 'array_numbers':
        case 'multiple_numerical':
            for (const subq of question.subquestions) {
                variables.push({
                    name: toRVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 200),
                    type: 'numeric',
                });
            }
            break;

        case 'array_texts':
            for (const subq of question.subquestions) {
                variables.push({
                    name: toRVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 200),
                    type: 'character',
                });
            }
            break;

        case 'ranking':
            for (let i = 1; i <= question.subquestions.length; i++) {
                variables.push({
                    name: toRVarName(`${question.code}_rank${i}`),
                    label: `${baseLabel} - Rank ${i}`.substring(0, 200),
                    type: 'character',
                });
            }
            break;

        default:
            variables.push({
                name: toRVarName(question.code),
                label: baseLabel,
                type: 'character',
            });
    }

    return variables;
}

/**
 * Generate R script file content
 */
export function generateRScript(
    survey: SurveyWithStructure,
    options: RExportOptions = {}
): string {
    const variables = buildVariables(survey, options);
    const dataFilename = options.dataFilename || 'survey_data.csv';
    const useHaven = options.useHaven !== false;

    let script = '';

    // Header
    script += `# R Script for: ${escapeR(survey.title)}\n`;
    script += `# Generated by Resonant Survey Platform\n`;
    script += `# Date: ${new Date().toISOString().split('T')[0]}\n\n`;

    // Load required packages
    if (useHaven) {
        script += `# Load required packages\n`;
        script += `if (!require("haven")) install.packages("haven")\n`;
        script += `library(haven)\n\n`;
    }

    // Read data
    script += `# Read survey data\n`;
    script += `data <- read.csv("${dataFilename}", stringsAsFactors = FALSE, na.strings = c("", "NA"))\n\n`;

    // Set column types
    script += `# Set column types\n`;
    for (const v of variables) {
        if (v.type === 'numeric') {
            script += `data$${v.name} <- as.numeric(data$${v.name})\n`;
        } else if (v.type === 'factor' && v.levels) {
            const levelsStr = v.levels.map(l => `"${escapeR(l.code)}"`).join(', ');
            const labelsStr = v.levels.map(l => `"${escapeR(l.label)}"`).join(', ');
            script += `data$${v.name} <- factor(data$${v.name}, levels = c(${levelsStr}), labels = c(${labelsStr}))\n`;
        }
    }
    script += `\n`;

    // Add variable labels
    script += `# Add variable labels\n`;
    if (useHaven) {
        for (const v of variables) {
            script += `attr(data$${v.name}, "label") <- "${escapeR(v.label)}"\n`;
        }
    } else {
        script += `# Variable labels (stored as comment attribute)\n`;
        for (const v of variables) {
            script += `comment(data$${v.name}) <- "${escapeR(v.label)}"\n`;
        }
    }
    script += `\n`;

    // Summary
    script += `# View data summary\n`;
    script += `str(data)\n`;
    script += `summary(data)\n\n`;

    // Save as RDS
    script += `# Save as R data file\n`;
    script += `saveRDS(data, "${survey.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.rds")\n`;

    if (useHaven) {
        script += `\n# Save as SPSS file (using haven)\n`;
        script += `write_sav(data, "${survey.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.sav")\n`;
    }

    return script;
}

/**
 * Generate CSV data file for R import
 */
export function generateRData(
    survey: SurveyWithStructure,
    responses: ResponseWithData[],
    options: RExportOptions = {}
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
            if (v.name === 'response_id') {
                row.push(`"${response.id}"`);
                continue;
            }

            const value = dataMap.get(v.name) || '';

            if (v.type === 'character' || v.type === 'factor') {
                row.push(`"${value.replace(/"/g, '""')}"`);
            } else {
                row.push(value === '' ? 'NA' : value);
            }
        }

        csv += row.join(',') + '\n';
    }

    return csv;
}

export type { RVariable, RExportOptions };
