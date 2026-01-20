// Resonant Survey Platform - TypeScript Types

export type SurveyStatus = 'draft' | 'active' | 'closed';

export type QuestionType =
    | 'text'
    | 'long_text'
    | 'multiple_choice_single'
    | 'multiple_choice_multiple'
    | 'array'
    | 'array_dual_scale'        // LimeSurvey Type 1 - Two scales per row
    | 'array_10_point'          // LimeSurvey Type B - 1-10 scale buttons
    | 'array_yes_no_uncertain'  // LimeSurvey Type C - Yes/No/Uncertain
    | 'array_increase_same_decrease' // LimeSurvey Type E - Increase/Same/Decrease
    | 'array_5_point'           // LimeSurvey Type A - Fixed 1-5 scale matrix
    | 'ranking'
    | 'equation'
    | 'text_display'
    | 'dropdown'
    | 'yes_no'
    | 'date'
    | 'numerical'
    | 'multiple_numerical'
    | 'array_numbers'
    | 'array_texts'
    | 'list_with_comment'       // LimeSurvey Type O - Radio with comment field
    | 'multiple_choice_with_comments' // LimeSurvey Type P - Checkboxes with comments
    | 'five_point_choice'       // LimeSurvey Type 5 - Simple 1-5 scale
    | 'huge_free_text'          // LimeSurvey Type U - Large textarea
    | 'multiple_short_text'     // LimeSurvey Type Q - Multiple text inputs
    | 'file_upload'             // LimeSurvey Type | - File upload
    | 'slider'                  // Visual slider variant of Numerical Input (N)
    | 'gender'                  // LimeSurvey Type G - Male/Female
    | 'language_switch'         // LimeSurvey Type I - Change survey language
    | 'array_column'            // LimeSurvey Type H - Array by Column (transposed)
    | 'button_select'           // Bootstrap Button styled single select
    | 'button_multi_select'     // Bootstrap Button styled multiple select
    | 'image_select'            // Image-based single select
    | 'image_multi_select'      // Image-based multiple select
    | 'nps'                     // Net Promoter Score (0-10 with categories)
    | 'csat'                    // Customer Satisfaction (1-5 stars)
    | 'ces';                    // Customer Effort Score (1-7)

export type ResponseStatus = 'incomplete' | 'complete' | 'screened_out';

export interface Survey {
    id: string;
    title: string;
    description?: string;
    status: SurveyStatus;
    settings: SurveySettings;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

// Email template configuration
export interface EmailTemplate {
    subject: string;
    body: string;
}

export interface EmailTemplates {
    invitation?: EmailTemplate;
    reminder?: EmailTemplate;
    confirmation?: EmailTemplate;
}

export interface SurveySettings {
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
    // Welcome message settings
    welcome_enabled?: boolean;
    welcome_title?: string;
    welcome_message?: string;
    welcome_button_text?: string;
    // End message settings
    end_enabled?: boolean;
    end_title?: string;
    end_message?: string;
    end_redirect_url?: string;
    end_redirect_delay?: number;
    // Screenout message settings
    screenout_enabled?: boolean;
    screenout_title?: string;
    screenout_message?: string;
    // Quota full message settings
    quota_full_enabled?: boolean;
    quota_full_title?: string;
    quota_full_message?: string;
    quota_full_redirect_url?: string;
    // Publication & scheduling settings
    start_date?: string;  // ISO 8601 datetime - survey becomes active after this date
    expiry_date?: string; // ISO 8601 datetime - survey closes automatically after this date
    // Custom code settings
    custom_css?: string;  // Custom CSS to inject (scoped to .survey-container)
    custom_js?: string;   // Custom JavaScript to execute (has access to SurveyAPI)
    // Email template settings
    email_templates?: EmailTemplates;
    // Display settings
    show_question_number?: boolean;   // Show Q1, Q2, etc. before question text
    show_question_code?: boolean;     // Show question code (e.g., CODE: Q001)
    show_group_name?: boolean;        // Display group title above questions
    show_group_description?: boolean; // Display group description below title
    // Behavior settings
    confirm_on_leave?: boolean;       // Warn before leaving incomplete survey
    admin_notification_email?: string; // Send notification on completion to this email
}

export interface QuestionGroup {
    id: string;
    survey_id: string;
    title?: string;
    description?: string;
    order_index: number;
    relevance_logic?: string;
    random_group?: string;
    created_at: string;
}

export interface Question {
    id: string;
    group_id: string;
    code: string;
    question_text: string;
    help_text?: string;
    question_type: QuestionType;
    settings: QuestionSettings;
    relevance_logic?: string;
    order_index: number;
    created_at: string;
}

export interface QuestionSettings {
    mandatory?: boolean;
    other_option?: boolean;
    display_columns?: number;
    min_answers?: number;
    max_answers?: number;
    hide_tip?: boolean;
    array_filter_question?: string; // Question code to filter from
    array_filter?: string; // Alternative property for array filter
    randomize_answers?: boolean;
    randomize_subquestions?: boolean;
    placeholder?: string;
    validation_regex?: string;
    validation_message?: string;
    validation_equation?: string;   // Custom validation expression
    validation_tip?: string;        // Hint text for validation requirements
    // Advanced question options
    randomization_group?: string;   // Group name for randomization
    subquestion_order?: 'default' | 'random' | 'alphabetical';
    array_filter_style?: 'hidden' | 'disabled';
    exclusive_option?: string;      // Answer code that excludes other selections
    numbers_only_other?: boolean;   // Only allow numbers in "other" field
    css_class?: string;             // Custom CSS class for question
    hidden?: boolean;               // Hide question from respondent (for equations)
    // Numerical question settings
    min_value?: number;
    max_value?: number;
    decimal_places?: number;
    prefix?: string;
    suffix?: string;
    // Dual scale array settings
    scale1_header?: string;
    scale2_header?: string;
    // 10-point array settings
    scale_low_label?: string;
    scale_high_label?: string;
    // Common array settings
    show_no_answer?: boolean;
    show_icons?: boolean;
    // Skip patterns for conditional logic
    skip_patterns?: Array<{
        condition: string;
        skipTo: string;
    }>;
    // File upload settings (LimeSurvey Type |)
    allowed_file_types?: string[];  // e.g., ['pdf', 'doc', 'jpg']
    max_file_size?: number;         // Maximum file size in MB
    max_files?: number;             // Maximum number of files allowed
    // Slider question settings (visual variant of Numerical Input)
    slider_min?: number;            // Minimum slider value (default: 0)
    slider_max?: number;            // Maximum slider value (default: 100)
    slider_step?: number;           // Step increment (default: 1)
    slider_show_value?: boolean;    // Show current value display (default: true)
    slider_show_ticks?: boolean;    // Show tick marks for discrete values (default: false)
    slider_min_label?: string;      // Custom label for min endpoint
    slider_max_label?: string;      // Custom label for max endpoint
    // Date question settings (LimeSurvey Type D)
    date_include_time?: boolean;    // Include time picker (datetime-local)
    date_format?: string;           // Date display format
    date_min?: string;              // Minimum date constraint
    date_max?: string;              // Maximum date constraint
    // Button select question settings
    button_layout?: 'horizontal' | 'vertical' | 'grid';
    button_style?: 'outline' | 'filled' | 'pill';
    // Image select question settings
    image_show_labels?: boolean;        // Show text labels below images (default: true)
    image_size?: 'small' | 'medium' | 'large';  // Image display size (default: medium)
    // NPS (Net Promoter Score) question settings
    nps_low_label?: string;             // Label for low end (default: "Not at all likely")
    nps_high_label?: string;            // Label for high end (default: "Extremely likely")
    nps_show_category?: boolean;        // Show Detractor/Passive/Promoter label (default: true)
}

export interface Subquestion {
    id: string;
    question_id: string;
    code: string;
    label: string;
    order_index: number;
    relevance_logic?: string;
    created_at: string;
}

export interface AnswerOption {
    id: string;
    question_id: string;
    code: string;
    label: string;
    order_index: number;
    scale_id: number;
    created_at: string;
}

export interface SurveyResponse {
    id: string;
    survey_id: string;
    participant_id?: string;
    session_id?: string;
    study_id?: string;
    status: ResponseStatus;
    started_at: string;
    completed_at?: string;
    metadata: ResponseMetadata;
    randomization_seed?: string;
}

export interface ResponseMetadata {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    device_type?: 'desktop' | 'mobile' | 'tablet';
    [key: string]: any;
}

export interface ResponseData {
    id: string;
    response_id: string;
    question_id: string;
    subquestion_id?: string;
    value: string;
    created_at: string;
}

// Full survey structure with nested data
export interface SurveyWithStructure extends Survey {
    question_groups: (QuestionGroup & {
        questions: (Question & {
            subquestions: Subquestion[];
            answer_options: AnswerOption[];
        })[];
    })[];
}

// Response with data
export interface ResponseWithData extends SurveyResponse {
    response_data: ResponseData[];
}
