// API Route: Survey Settings - Welcome/end messages and advanced settings
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


interface RouteParams {
    params: Promise<{ id: string }>;
}

export interface SurveySettings {
    // Display settings
    format?: 'question_by_question' | 'group_by_group' | 'all_in_one';
    theme?: 'editorial_academic' | 'modern' | 'minimal';
    show_progress_bar?: boolean;
    show_question_index?: boolean;
    show_group_info?: boolean;

    // Navigation settings
    allow_backward_navigation?: boolean;
    allow_jump_to_question?: boolean;
    keyboard_navigation?: boolean;

    // Save & resume settings
    save_incomplete_responses?: boolean;
    auto_save_interval?: number; // seconds, 0 = disabled
    allow_resume_later?: boolean;
    resume_token_expiry_days?: number;

    // Welcome message
    welcome_enabled?: boolean;
    welcome_title?: string;
    welcome_message?: string;
    welcome_button_text?: string;

    // End messages
    end_enabled?: boolean;
    end_title?: string;
    end_message?: string;
    end_redirect_url?: string;
    end_redirect_delay?: number; // seconds

    // Screenout message
    screenout_enabled?: boolean;
    screenout_title?: string;
    screenout_message?: string;
    screenout_redirect_url?: string;

    // Quota full message
    quota_full_enabled?: boolean;
    quota_full_title?: string;
    quota_full_message?: string;
    quota_full_redirect_url?: string;

    // Prolific integration
    prolific_integration?: {
        enabled: boolean;
        completion_code?: string;
        screenout_code?: string;
    };

    // Branding
    custom_css?: string;
    logo_url?: string;
    logo_position?: 'left' | 'center' | 'right';
    footer_text?: string;

    // Data collection
    collect_timing_data?: boolean;
    collect_device_info?: boolean;
    anonymize_ip?: boolean;

    // Publication & scheduling
    start_date?: string;  // ISO 8601 datetime - survey becomes active after this date
    expiry_date?: string; // ISO 8601 datetime - survey closes automatically after this date
}

// GET /api/survey/[id]/settings - Get survey settings
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { data: survey, error } = await getSupabaseServer()
            .from('surveys')
            .select('id, title, settings')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Survey not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        // Merge with defaults
        const defaultSettings: SurveySettings = {
            format: 'group_by_group',
            theme: 'editorial_academic',
            show_progress_bar: true,
            show_question_index: true,
            show_group_info: true,
            allow_backward_navigation: true,
            allow_jump_to_question: false,
            keyboard_navigation: true,
            save_incomplete_responses: true,
            auto_save_interval: 30,
            allow_resume_later: true,
            resume_token_expiry_days: 7,
            welcome_enabled: true,
            welcome_title: 'Welcome',
            welcome_message: 'Thank you for participating in this survey.',
            welcome_button_text: 'Start Survey',
            end_enabled: true,
            end_title: 'Thank You',
            end_message: 'Your response has been recorded.',
            end_redirect_delay: 0,
            screenout_enabled: true,
            screenout_title: 'Thank You',
            screenout_message: 'Unfortunately, you do not qualify for this survey.',
            quota_full_enabled: true,
            quota_full_title: 'Survey Closed',
            quota_full_message: 'This survey has reached its quota and is no longer accepting responses.',
            collect_timing_data: true,
            collect_device_info: true,
            anonymize_ip: false,
        };

        const settings = { ...defaultSettings, ...survey.settings };

        return NextResponse.json({
            survey_id: survey.id,
            survey_title: survey.title,
            settings,
        });
    } catch (error: any) {
        console.error('Error fetching survey settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/survey/[id]/settings - Update survey settings
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate settings structure
        const validKeys = [
            'format', 'theme', 'show_progress_bar', 'show_question_index', 'show_group_info',
            'allow_backward_navigation', 'allow_jump_to_question', 'keyboard_navigation',
            'save_incomplete_responses', 'auto_save_interval', 'allow_resume_later', 'resume_token_expiry_days',
            'welcome_enabled', 'welcome_title', 'welcome_message', 'welcome_button_text',
            'end_enabled', 'end_title', 'end_message', 'end_redirect_url', 'end_redirect_delay',
            'screenout_enabled', 'screenout_title', 'screenout_message', 'screenout_redirect_url',
            'quota_full_enabled', 'quota_full_title', 'quota_full_message', 'quota_full_redirect_url',
            'prolific_integration', 'custom_css', 'logo_url', 'logo_position', 'footer_text',
            'collect_timing_data', 'collect_device_info', 'anonymize_ip',
            'start_date', 'expiry_date',
        ];

        const settings: Record<string, any> = {};
        for (const key of validKeys) {
            if (body[key] !== undefined) {
                settings[key] = body[key];
            }
        }

        // Get current settings and merge
        const { data: currentSurvey, error: fetchError } = await getSupabaseServer()
            .from('surveys')
            .select('settings')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Survey not found' },
                    { status: 404 }
                );
            }
            throw fetchError;
        }

        const mergedSettings = { ...currentSurvey.settings, ...settings };

        const { data: survey, error } = await getSupabaseServer()
            .from('surveys')
            .update({
                settings: mergedSettings,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('id, title, settings')
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({
            survey_id: survey.id,
            settings: survey.settings,
        });
    } catch (error: any) {
        console.error('Error updating survey settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/survey/[id]/settings - Partial update (convenience method)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    return PUT(request, { params });
}
