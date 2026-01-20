// LimeSurvey LSS File Importer
// Part of Agent 4: Survey Importer
// Parses LimeSurvey's .lss (XML) export format

import type {
    Survey,
    QuestionGroup,
    Question,
    Subquestion,
    AnswerOption,
    SurveySettings,
    QuestionType,
} from '@/lib/supabase/survey-types';

// Type for questions in LSS import
type LSSQuestion = Partial<Question> & {
    subquestions: Partial<Subquestion>[];
    answer_options: Partial<AnswerOption>[];
};

// Type for question groups in LSS import
type LSSQuestionGroups = (Partial<QuestionGroup> & {
    questions: LSSQuestion[];
})[];

interface LSSImportResult {
    success: boolean;
    survey?: Partial<Survey> & {
        question_groups: LSSQuestionGroups;
    };
    errors?: string[];
    warnings?: string[];
}

// LimeSurvey question type mapping
const QUESTION_TYPE_MAP: Record<string, QuestionType> = {
    'S': 'text',           // Short free text
    'T': 'long_text',      // Long free text
    'U': 'long_text',      // Huge free text
    'L': 'multiple_choice_single',  // List (Radio)
    'O': 'multiple_choice_single',  // List with comment
    '!': 'dropdown',       // List (Dropdown)
    'M': 'multiple_choice_multiple', // Multiple choice
    'P': 'multiple_choice_multiple', // Multiple choice with comments
    'F': 'array',          // Array (Flexible labels)
    'A': 'array',          // Array (5 point choice)
    'B': 'array',          // Array (10 point choice)
    'C': 'array',          // Array (Yes/No/Uncertain)
    'E': 'array',          // Array (Increase/Same/Decrease)
    'H': 'array',          // Array by column
    '1': 'array',          // Dual Scale Array
    ';': 'array_texts',    // Array (Multi Flexi) (Text)
    ':': 'array_numbers',  // Array (Multi Flexi) (Numbers)
    'R': 'ranking',        // Ranking
    'D': 'date',           // Date/Time
    'N': 'numerical',      // Numerical Input
    'K': 'multiple_numerical', // Multiple Numerical Input
    'Y': 'yes_no',         // Yes/No
    'X': 'text_display',   // Text display
    '*': 'equation',       // Equation
};

export class LSSImporter {
    private parser: DOMParser;
    private errors: string[] = [];
    private warnings: string[] = [];

    constructor() {
        this.parser = new DOMParser();
    }

    /**
     * Parse an LSS XML file and convert to our survey format
     */
    async parse(xmlContent: string): Promise<LSSImportResult> {
        this.errors = [];
        this.warnings = [];

        try {
            const doc = this.parser.parseFromString(xmlContent, 'text/xml');

            // Check for parsing errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                return {
                    success: false,
                    errors: ['Invalid XML format: ' + parseError.textContent],
                };
            }

            // Parse survey
            const survey = this.parseSurvey(doc);

            return {
                success: true,
                survey,
                warnings: this.warnings.length > 0 ? this.warnings : undefined,
            };
        } catch (error: any) {
            return {
                success: false,
                errors: [error.message],
            };
        }
    }

    /**
     * Parse the main survey element
     */
    private parseSurvey(doc: Document): LSSImportResult['survey'] {
        const surveyEl = doc.querySelector('surveys > rows > row');
        if (!surveyEl) {
            throw new Error('No survey found in LSS file');
        }

        const title = this.getText(surveyEl, 'surveyls_title') ||
            this.getText(doc, 'surveys_languagesettings > rows > row > surveyls_title') ||
            'Imported Survey';

        const description = this.getText(surveyEl, 'surveyls_description') ||
            this.getText(doc, 'surveys_languagesettings > rows > row > surveyls_description') || '';

        // Parse settings
        const settings: SurveySettings = {
            format: this.parseFormat(this.getText(surveyEl, 'format')),
            show_progress_bar: this.getText(surveyEl, 'showprogress') === 'Y',
            allow_backward_navigation: this.getText(surveyEl, 'allowprev') === 'Y',
        };

        // Parse welcome and end messages
        const welcomeText = this.getText(doc, 'surveys_languagesettings > rows > row > surveyls_welcometext');
        const endText = this.getText(doc, 'surveys_languagesettings > rows > row > surveyls_endtext');

        if (welcomeText) {
            settings.welcome_enabled = true;
            settings.welcome_message = welcomeText;
        }

        if (endText) {
            settings.end_enabled = true;
            settings.end_message = endText;
        }

        // Parse question groups
        const groups = this.parseGroups(doc);

        return {
            title,
            description,
            settings,
            status: 'draft',
            question_groups: groups,
        };
    }

    /**
     * Parse question groups
     */
    private parseGroups(doc: Document): LSSQuestionGroups {
        const groups: LSSQuestionGroups = [];
        const groupRows = doc.querySelectorAll('groups > rows > row');

        groupRows.forEach((groupEl, index) => {
            const gid = this.getText(groupEl, 'gid') || '';
            const title = this.getText(doc, `group_l10ns > rows > row[gid="${gid}"] > group_name`) ||
                this.getText(groupEl, 'group_name') || '';
            const description = this.getText(doc, `group_l10ns > rows > row[gid="${gid}"] > description`) ||
                this.getText(groupEl, 'description') || '';

            const relevance = this.getText(groupEl, 'grelevance');
            const randomGroup = this.getText(groupEl, 'randomization_group');

            // Parse questions for this group
            const questions = this.parseQuestions(doc, gid);

            groups.push({
                title,
                description: description || undefined,
                order_index: index,
                relevance_logic: relevance && relevance !== '1' ? relevance : undefined,
                random_group: randomGroup || undefined,
                questions,
            });
        });

        return groups;
    }

    /**
     * Parse questions for a group
     */
    private parseQuestions(doc: Document, gid: string): LSSQuestion[] {
        const questions: LSSQuestion[] = [];
        const questionRows = doc.querySelectorAll(`questions > rows > row`);

        let orderIndex = 0;
        questionRows.forEach((questionEl) => {
            const questionGid = this.getText(questionEl, 'gid');
            if (questionGid !== gid) return;

            const qid = this.getText(questionEl, 'qid') || '';
            const code = this.getText(questionEl, 'title') || `Q${qid}`;
            const type = this.getText(questionEl, 'type') || 'S';

            // Get question text from localization table
            const questionText = this.getText(doc, `question_l10ns > rows > row[qid="${qid}"] > question`) ||
                this.getText(questionEl, 'question') || '';
            const helpText = this.getText(doc, `question_l10ns > rows > row[qid="${qid}"] > help`) ||
                this.getText(questionEl, 'help') || '';

            // Map question type
            const questionType = QUESTION_TYPE_MAP[type] || 'text';
            if (!QUESTION_TYPE_MAP[type]) {
                this.warnings.push(`Unknown question type "${type}" for ${code}, defaulting to text`);
            }

            // Parse settings
            const settings = this.parseQuestionSettings(questionEl);
            const relevance = this.getText(questionEl, 'relevance');

            // Parse subquestions
            const subquestions = this.parseSubquestions(doc, qid);

            // Parse answer options
            const answerOptions = this.parseAnswerOptions(doc, qid);

            questions.push({
                code,
                question_text: this.cleanHtml(questionText),
                help_text: helpText ? this.cleanHtml(helpText) : undefined,
                question_type: questionType,
                settings,
                relevance_logic: relevance && relevance !== '1' ? relevance : undefined,
                order_index: orderIndex++,
                subquestions,
                answer_options: answerOptions,
            });
        });

        return questions;
    }

    /**
     * Parse question settings/attributes
     */
    private parseQuestionSettings(questionEl: Element): Question['settings'] {
        const settings: Question['settings'] = {};

        const mandatory = this.getText(questionEl, 'mandatory');
        settings.mandatory = mandatory === 'Y';

        const other = this.getText(questionEl, 'other');
        settings.other_option = other === 'Y';

        // Could parse more attributes here
        // random_order, minimum_answers, maximum_answers, etc.

        return settings;
    }

    /**
     * Parse subquestions
     */
    private parseSubquestions(doc: Document, qid: string): Partial<Subquestion>[] {
        const subquestions: Partial<Subquestion>[] = [];
        const subqRows = doc.querySelectorAll(`subquestions > rows > row`);

        let orderIndex = 0;
        subqRows.forEach((subqEl) => {
            const subqQid = this.getText(subqEl, 'parent_qid');
            if (subqQid !== qid) return;

            const sqid = this.getText(subqEl, 'qid');
            const code = this.getText(subqEl, 'title') || `SQ${sqid}`;

            // Get label from localization
            const label = this.getText(doc, `question_l10ns > rows > row[qid="${sqid}"] > question`) ||
                this.getText(subqEl, 'question') || code;

            const relevance = this.getText(subqEl, 'relevance');

            subquestions.push({
                code,
                label: this.cleanHtml(label),
                order_index: orderIndex++,
                relevance_logic: relevance && relevance !== '1' ? relevance : undefined,
            });
        });

        return subquestions;
    }

    /**
     * Parse answer options
     */
    private parseAnswerOptions(doc: Document, qid: string): Partial<AnswerOption>[] {
        const options: Partial<AnswerOption>[] = [];
        const answerRows = doc.querySelectorAll(`answers > rows > row`);

        let orderIndex = 0;
        answerRows.forEach((answerEl) => {
            const answerQid = this.getText(answerEl, 'qid');
            if (answerQid !== qid) return;

            const code = this.getText(answerEl, 'code') || `A${orderIndex + 1}`;
            const aid = this.getText(answerEl, 'aid');

            // Get label from localization
            const label = this.getText(doc, `answer_l10ns > rows > row[aid="${aid}"] > answer`) ||
                this.getText(answerEl, 'answer') || code;

            const scaleId = parseInt(this.getText(answerEl, 'scale_id') || '0');

            options.push({
                code,
                label: this.cleanHtml(label),
                order_index: orderIndex++,
                scale_id: scaleId,
            });
        });

        return options;
    }

    /**
     * Parse survey format
     */
    private parseFormat(format: string | null): SurveySettings['format'] {
        switch (format) {
            case 'Q':
                return 'question_by_question';
            case 'G':
                return 'group_by_group';
            case 'A':
                return 'all_in_one';
            default:
                return 'group_by_group';
        }
    }

    /**
     * Get text content from an element
     */
    private getText(parent: Document | Element, selector: string): string | null {
        const el = parent.querySelector(selector);
        return el?.textContent?.trim() || null;
    }

    /**
     * Clean HTML from text
     */
    private cleanHtml(html: string): string {
        // Basic HTML cleaning - preserve line breaks
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
}

/**
 * Parse LSS file content and return survey structure
 */
export async function parseLSSFile(content: string): Promise<LSSImportResult> {
    const importer = new LSSImporter();
    return importer.parse(content);
}

export default LSSImporter;
