// Survey JSON Schema Definition
// This is the format for importing/exporting surveys

export interface SurveyJSON {
    title: string;
    description?: string;
    status?: 'draft' | 'active' | 'closed';
    settings?: {
        format?: 'question_by_question' | 'group_by_group' | 'all_in_one';
        theme?: 'editorial_academic' | 'modern' | 'minimal';
        show_progress_bar?: boolean;
        allow_backward_navigation?: boolean;
        save_incomplete_responses?: boolean;
        completion_redirect_url?: string;
        screenout_redirect_url?: string;
        prolific_integration?: {
            enabled: boolean;
            completion_code?: string;
            screenout_code?: string;
        };
    };
    question_groups: QuestionGroupJSON[];
}

export interface QuestionGroupJSON {
    title?: string;
    description?: string;
    order_index: number;
    relevance_logic?: string;
    random_group?: string;
    questions: QuestionJSON[];
}

export interface QuestionJSON {
    code: string;
    question_text: string;
    help_text?: string;
    question_type: 'text' | 'long_text' | 'multiple_choice_single' | 'multiple_choice_multiple' | 'array' | 'ranking' | 'equation' | 'text_display' | 'dropdown' | 'yes_no' | 'date';
    settings?: {
        mandatory?: boolean;
        other_option?: boolean;
        display_columns?: number;
        min_answers?: number;
        max_answers?: number;
        hide_tip?: boolean;
        array_filter_question?: string;
        randomize_answers?: boolean;
        randomize_subquestions?: boolean;
        placeholder?: string;
        validation_regex?: string;
        validation_message?: string;
    };
    relevance_logic?: string;
    order_index: number;
    subquestions?: SubquestionJSON[];
    answer_options?: AnswerOptionJSON[];
}

export interface SubquestionJSON {
    code: string;
    label: string;
    order_index: number;
    relevance_logic?: string;
}

export interface AnswerOptionJSON {
    code: string;
    label: string;
    order_index: number;
    scale_id?: number;
}

// Example survey JSON
export const EXAMPLE_SURVEY: SurveyJSON = {
    title: "AI Safety Messaging Survey",
    description: "Testing public perceptions of AI safety messages",
    status: "draft",
    settings: {
        format: "group_by_group",
        theme: "editorial_academic",
        show_progress_bar: true,
        allow_backward_navigation: false,
        prolific_integration: {
            enabled: true,
            completion_code: "C1234567",
            screenout_code: "S1234567"
        }
    },
    question_groups: [
        {
            title: "Demographics",
            order_index: 0,
            questions: [
                {
                    code: "Q1",
                    question_text: "What is your age?",
                    question_type: "text",
                    order_index: 0,
                    settings: {
                        mandatory: true,
                        validation_regex: "^[0-9]{1,3}$",
                        validation_message: "Please enter a valid age"
                    }
                },
                {
                    code: "Q2",
                    question_text: "How concerned are you about AI safety?",
                    question_type: "multiple_choice_single",
                    order_index: 1,
                    settings: {
                        mandatory: true
                    },
                    answer_options: [
                        { code: "A1", label: "Very concerned", order_index: 0 },
                        { code: "A2", label: "Somewhat concerned", order_index: 1 },
                        { code: "A3", label: "Not very concerned", order_index: 2 },
                        { code: "A4", label: "Not at all concerned", order_index: 3 }
                    ]
                }
            ]
        },
        {
            title: "Message Evaluation",
            order_index: 1,
            relevance_logic: "Q2 == 'A1' OR Q2 == 'A2'",
            questions: [
                {
                    code: "Q3",
                    question_text: "Please rate the following statements:",
                    question_type: "array",
                    order_index: 0,
                    subquestions: [
                        { code: "SQ001", label: "AI poses existential risks", order_index: 0 },
                        { code: "SQ002", label: "We need government oversight", order_index: 1 },
                        { code: "SQ003", label: "Companies should self-regulate", order_index: 2 }
                    ],
                    answer_options: [
                        { code: "A1", label: "Strongly agree", order_index: 0 },
                        { code: "A2", label: "Agree", order_index: 1 },
                        { code: "A3", label: "Neutral", order_index: 2 },
                        { code: "A4", label: "Disagree", order_index: 3 },
                        { code: "A5", label: "Strongly disagree", order_index: 4 }
                    ]
                }
            ]
        }
    ]
};
