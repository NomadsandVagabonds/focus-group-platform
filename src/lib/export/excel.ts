// Excel Export Library (.xlsx)
// Generates Excel workbooks for survey data export

import * as XLSX from 'xlsx';
import type { SurveyWithStructure, Question, Subquestion, AnswerOption, ResponseWithData } from '@/lib/supabase/survey-types';

export interface ExcelVariable {
    name: string;
    label: string;
    type: 'numeric' | 'string' | 'date';
    questionCode: string;
    subquestionCode?: string;
    valueLabels?: Map<string, string>;
}

export interface ExcelExportOptions {
    includeResponseId?: boolean;
    includeTimestamps?: boolean;
    includeMetadata?: boolean;
    includeValueLabelsSheet?: boolean;
    sheetName?: string;
}

/**
 * Generate variable name from question code
 */
function toVarName(code: string): string {
    return code.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 64);
}

/**
 * Build variable definitions from survey structure
 */
function buildVariables(survey: SurveyWithStructure, options: ExcelExportOptions): ExcelVariable[] {
    const variables: ExcelVariable[] = [];

    // Response ID
    if (options.includeResponseId !== false) {
        variables.push({
            name: 'response_id',
            label: 'Response ID',
            type: 'string',
            questionCode: '_system',
        });
    }

    // Timestamps
    if (options.includeTimestamps) {
        variables.push({
            name: 'started_at',
            label: 'Started At',
            type: 'date',
            questionCode: '_system',
        });
        variables.push({
            name: 'completed_at',
            label: 'Completed At',
            type: 'date',
            questionCode: '_system',
        });
    }

    // Metadata
    if (options.includeMetadata) {
        variables.push({
            name: 'participant_id',
            label: 'Participant ID',
            type: 'string',
            questionCode: '_system',
        });
        variables.push({
            name: 'status',
            label: 'Response Status',
            type: 'string',
            questionCode: '_system',
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
 * Get Excel variables for a single question
 */
function getVariablesForQuestion(
    question: Question & { subquestions: Subquestion[]; answer_options: AnswerOption[] }
): ExcelVariable[] {
    const variables: ExcelVariable[] = [];
    const baseLabel = question.question_text.substring(0, 200);

    switch (question.question_type) {
        case 'text':
        case 'long_text':
        case 'huge_free_text':
            variables.push({
                name: toVarName(question.code),
                label: baseLabel,
                type: 'string',
                questionCode: question.code,
            });
            break;

        case 'numerical':
            variables.push({
                name: toVarName(question.code),
                label: baseLabel,
                type: 'numeric',
                questionCode: question.code,
            });
            break;

        case 'date':
            variables.push({
                name: toVarName(question.code),
                label: baseLabel,
                type: 'date',
                questionCode: question.code,
            });
            break;

        case 'multiple_choice_single':
        case 'dropdown':
        case 'yes_no':
        case 'five_point_choice':
        case 'list_with_comment':
            const valueLabels = new Map<string, string>();
            for (const opt of question.answer_options || []) {
                valueLabels.set(opt.code, opt.label);
            }
            variables.push({
                name: toVarName(question.code),
                label: baseLabel,
                type: 'string',
                questionCode: question.code,
                valueLabels: valueLabels.size > 0 ? valueLabels : undefined,
            });

            // For list_with_comment, add the comment field
            if (question.question_type === 'list_with_comment') {
                variables.push({
                    name: toVarName(`${question.code}_comment`),
                    label: `${baseLabel} - Comment`,
                    type: 'string',
                    questionCode: question.code,
                    subquestionCode: 'comment',
                });
            }
            break;

        case 'multiple_choice_multiple':
        case 'multiple_choice_with_comments':
            // Each option becomes its own binary variable
            const options = question.answer_options?.length > 0
                ? question.answer_options
                : question.subquestions;

            for (const opt of options || []) {
                variables.push({
                    name: toVarName(`${question.code}_${opt.code}`),
                    label: `${baseLabel} - ${opt.label}`.substring(0, 200),
                    type: 'numeric',
                    questionCode: question.code,
                    subquestionCode: opt.code,
                    valueLabels: new Map([['0', 'Not selected'], ['1', 'Selected']]),
                });

                // For multiple_choice_with_comments, add the comment field
                if (question.question_type === 'multiple_choice_with_comments') {
                    variables.push({
                        name: toVarName(`${question.code}_${opt.code}_comment`),
                        label: `${baseLabel} - ${opt.label} - Comment`.substring(0, 200),
                        type: 'string',
                        questionCode: question.code,
                        subquestionCode: `${opt.code}_comment`,
                    });
                }
            }
            break;

        case 'array':
        case 'array_5_point':
        case 'array_10_point':
        case 'array_yes_no_uncertain':
        case 'array_increase_same_decrease':
            // Each subquestion becomes a variable
            const answerLabels = new Map<string, string>();
            for (const opt of (question.answer_options || []).filter(o => o.scale_id === 0 || o.scale_id === null)) {
                answerLabels.set(opt.code, opt.label);
            }

            for (const subq of question.subquestions || []) {
                variables.push({
                    name: toVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 200),
                    type: 'string',
                    questionCode: question.code,
                    subquestionCode: subq.code,
                    valueLabels: answerLabels.size > 0 ? answerLabels : undefined,
                });
            }
            break;

        case 'array_dual_scale':
            // Two variables per subquestion
            const scale1Labels = new Map<string, string>();
            const scale2Labels = new Map<string, string>();
            for (const opt of question.answer_options || []) {
                if (opt.scale_id === 0 || opt.scale_id === null) {
                    scale1Labels.set(opt.code, opt.label);
                } else if (opt.scale_id === 1) {
                    scale2Labels.set(opt.code, opt.label);
                }
            }

            for (const subq of question.subquestions || []) {
                variables.push({
                    name: toVarName(`${question.code}_${subq.code}_scale1`),
                    label: `${baseLabel} - ${subq.label} (Scale 1)`.substring(0, 200),
                    type: 'string',
                    questionCode: question.code,
                    subquestionCode: `${subq.code}_scale1`,
                    valueLabels: scale1Labels.size > 0 ? scale1Labels : undefined,
                });
                variables.push({
                    name: toVarName(`${question.code}_${subq.code}_scale2`),
                    label: `${baseLabel} - ${subq.label} (Scale 2)`.substring(0, 200),
                    type: 'string',
                    questionCode: question.code,
                    subquestionCode: `${subq.code}_scale2`,
                    valueLabels: scale2Labels.size > 0 ? scale2Labels : undefined,
                });
            }
            break;

        case 'array_numbers':
        case 'multiple_numerical':
            for (const subq of question.subquestions || []) {
                variables.push({
                    name: toVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 200),
                    type: 'numeric',
                    questionCode: question.code,
                    subquestionCode: subq.code,
                });
            }
            break;

        case 'array_texts':
        case 'multiple_short_text':
            for (const subq of question.subquestions || []) {
                variables.push({
                    name: toVarName(`${question.code}_${subq.code}`),
                    label: `${baseLabel} - ${subq.label}`.substring(0, 200),
                    type: 'string',
                    questionCode: question.code,
                    subquestionCode: subq.code,
                });
            }
            break;

        case 'ranking':
            // Each rank position becomes a variable
            const numItems = question.subquestions?.length || question.answer_options?.length || 0;
            for (let i = 1; i <= numItems; i++) {
                variables.push({
                    name: toVarName(`${question.code}_rank${i}`),
                    label: `${baseLabel} - Rank ${i}`.substring(0, 200),
                    type: 'string',
                    questionCode: question.code,
                    subquestionCode: `rank${i}`,
                });
            }
            break;

        case 'equation':
        case 'text_display':
            // These don't collect data
            break;

        case 'file_upload':
            // Store file information as JSON string
            variables.push({
                name: toVarName(question.code),
                label: `${baseLabel} (File Upload)`,
                type: 'string',
                questionCode: question.code,
            });
            break;

        default:
            // Fallback for unknown types
            variables.push({
                name: toVarName(question.code),
                label: baseLabel,
                type: 'string',
                questionCode: question.code,
            });
    }

    return variables;
}

/**
 * Build a map from question ID to question code
 */
function buildQuestionIdMap(survey: SurveyWithStructure): Map<string, string> {
    const map = new Map<string, string>();
    for (const group of survey.question_groups) {
        for (const question of group.questions) {
            map.set(question.id, question.code);
            for (const subq of question.subquestions || []) {
                map.set(subq.id, subq.code);
            }
        }
    }
    return map;
}

/**
 * Generate Excel workbook from survey data
 */
export function generateExcelWorkbook(
    survey: SurveyWithStructure,
    responses: ResponseWithData[],
    options: ExcelExportOptions = {}
): XLSX.WorkBook {
    const variables = buildVariables(survey, options);
    const questionIdMap = buildQuestionIdMap(survey);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create data array
    const data: any[][] = [];

    // Header row - use variable labels
    data.push(variables.map(v => v.label));

    // Also create a header row with variable names (for technical use)
    const headerNames = variables.map(v => v.name);

    // Data rows
    for (const response of responses) {
        const row: any[] = [];

        // Build a map of response data for quick lookup
        const dataMap = new Map<string, string>();
        for (const rd of response.response_data || []) {
            const qCode = questionIdMap.get(rd.question_id) || rd.question_id;
            const sqCode = rd.subquestion_id ? (questionIdMap.get(rd.subquestion_id) || rd.subquestion_id) : null;
            const key = sqCode ? `${qCode}_${sqCode}` : qCode;
            dataMap.set(key, rd.value);
        }

        for (const v of variables) {
            // System variables
            if (v.questionCode === '_system') {
                switch (v.name) {
                    case 'response_id':
                        row.push(response.id);
                        break;
                    case 'started_at':
                        row.push(response.started_at ? new Date(response.started_at) : null);
                        break;
                    case 'completed_at':
                        row.push(response.completed_at ? new Date(response.completed_at) : null);
                        break;
                    case 'participant_id':
                        row.push(response.participant_id || '');
                        break;
                    case 'status':
                        row.push(response.status);
                        break;
                    default:
                        row.push('');
                }
                continue;
            }

            // Question data
            const key = v.subquestionCode
                ? `${v.questionCode}_${v.subquestionCode}`
                : v.questionCode;

            let value = dataMap.get(key);

            if (value === undefined || value === null) {
                row.push('');
                continue;
            }

            // Handle multiple choice (stored as array)
            if (value.startsWith('[') && value.endsWith(']')) {
                try {
                    const arr = JSON.parse(value);
                    if (Array.isArray(arr)) {
                        // Check if this subquestion code is in the array
                        if (v.subquestionCode && arr.includes(v.subquestionCode)) {
                            row.push(1);
                        } else if (v.subquestionCode) {
                            row.push(0);
                        } else {
                            row.push(arr.join(', '));
                        }
                        continue;
                    }
                } catch (e) {
                    // Not JSON, use as-is
                }
            }

            // Type conversion
            if (v.type === 'numeric') {
                const num = parseFloat(value);
                row.push(isNaN(num) ? value : num);
            } else if (v.type === 'date') {
                try {
                    row.push(new Date(value));
                } catch {
                    row.push(value);
                }
            } else {
                // Get label if value labels exist
                if (v.valueLabels && v.valueLabels.has(value)) {
                    row.push(`${value} - ${v.valueLabels.get(value)}`);
                } else {
                    row.push(value);
                }
            }
        }

        data.push(row);
    }

    // Create main data sheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const colWidths = variables.map(v => ({
        wch: Math.min(50, Math.max(10, v.label.length + 2))
    }));
    ws['!cols'] = colWidths;

    // Add sheet to workbook
    const sheetName = options.sheetName || 'Survey Data';
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

    // Add value labels sheet if requested
    if (options.includeValueLabelsSheet) {
        const labelsData: any[][] = [['Variable', 'Code', 'Label']];
        for (const v of variables) {
            if (v.valueLabels && v.valueLabels.size > 0) {
                for (const [code, label] of v.valueLabels) {
                    labelsData.push([v.name, code, label]);
                }
            }
        }

        if (labelsData.length > 1) {
            const labelsSheet = XLSX.utils.aoa_to_sheet(labelsData);
            labelsSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 50 }];
            XLSX.utils.book_append_sheet(wb, labelsSheet, 'Value Labels');
        }
    }

    // Add survey info sheet
    const infoData: any[][] = [
        ['Survey Export Information'],
        [''],
        ['Survey Title', survey.title],
        ['Description', survey.description || ''],
        ['Total Responses', responses.length],
        ['Export Date', new Date().toISOString()],
        [''],
        ['Generated by Resonant Survey Platform'],
    ];
    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    infoSheet['!cols'] = [{ wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, infoSheet, 'Info');

    // Add variable names sheet (technical reference)
    const varsData: any[][] = [['Variable Name', 'Label', 'Type', 'Question Code']];
    for (const v of variables) {
        varsData.push([v.name, v.label, v.type, v.questionCode]);
    }
    const varsSheet = XLSX.utils.aoa_to_sheet(varsData);
    varsSheet['!cols'] = [{ wch: 30 }, { wch: 50 }, { wch: 10 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, varsSheet, 'Variables');

    return wb;
}

/**
 * Generate Excel file as Buffer
 */
export function generateExcelBuffer(
    survey: SurveyWithStructure,
    responses: ResponseWithData[],
    options: ExcelExportOptions = {}
): Buffer {
    const wb = generateExcelWorkbook(survey, responses, options);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate Excel file as base64 string
 */
export function generateExcelBase64(
    survey: SurveyWithStructure,
    responses: ResponseWithData[],
    options: ExcelExportOptions = {}
): string {
    const wb = generateExcelWorkbook(survey, responses, options);
    return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}
