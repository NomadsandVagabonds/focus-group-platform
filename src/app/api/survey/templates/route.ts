// API Route: Survey Templates
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/survey/templates - List all templates
export async function GET() {
    try {
        const { data: templates, error } = await supabase
            .from('survey_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Table might not exist yet, return empty array
            if (error.code === '42P01') {
                return NextResponse.json({ templates: [] });
            }
            throw error;
        }

        return NextResponse.json({ templates: templates || [] });
    } catch (error: any) {
        console.error('Error fetching templates:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/survey/templates - Create a new template from a survey
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, category, sourceSurveyId } = body;

        if (!name || !sourceSurveyId) {
            return NextResponse.json(
                { error: 'Name and source survey are required' },
                { status: 400 }
            );
        }

        // Fetch the source survey with full structure
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select(`
                *,
                question_groups (
                    *,
                    questions (
                        *,
                        subquestions (*),
                        answer_options (*)
                    )
                )
            `)
            .eq('id', sourceSurveyId)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ error: 'Source survey not found' }, { status: 404 });
        }

        // Count questions
        const questionCount = survey.question_groups?.reduce(
            (acc: number, group: any) => acc + (group.questions?.length || 0),
            0
        ) || 0;

        // Create the template
        const { data: template, error: templateError } = await supabase
            .from('survey_templates')
            .insert({
                name,
                description: description || '',
                category: category || 'general',
                question_count: questionCount,
                survey_structure: {
                    settings: survey.settings,
                    question_groups: survey.question_groups,
                },
            })
            .select()
            .single();

        if (templateError) {
            // If table doesn't exist, create it first
            if (templateError.code === '42P01') {
                return NextResponse.json(
                    { error: 'Templates table not set up. Please run migrations.' },
                    { status: 500 }
                );
            }
            throw templateError;
        }

        return NextResponse.json({ template }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating template:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
