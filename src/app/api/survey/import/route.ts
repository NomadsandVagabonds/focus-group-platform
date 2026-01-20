// API Route: Import Survey from JSON or LimeSurvey LSS
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SurveyJSON } from '@/lib/survey/survey-json-schema';
import { parseLSSFile } from '@/lib/survey/lss-importer';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        let surveyJSON: SurveyJSON;

        // Check if this is an LSS (XML) file upload
        if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
            const xmlContent = await request.text();
            const result = await parseLSSFile(xmlContent);

            if (!result.success || !result.survey) {
                return NextResponse.json({
                    error: 'Failed to parse LSS file',
                    details: result.errors,
                }, { status: 400 });
            }

            // Convert LSS result to SurveyJSON format
            surveyJSON = result.survey as SurveyJSON;

            // Return warnings if any
            if (result.warnings && result.warnings.length > 0) {
                console.warn('LSS Import warnings:', result.warnings);
            }
        } else if (contentType.includes('multipart/form-data')) {
            // Handle file upload
            const formData = await request.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }

            const content = await file.text();
            const fileName = file.name.toLowerCase();

            if (fileName.endsWith('.lss') || fileName.endsWith('.xml')) {
                const result = await parseLSSFile(content);

                if (!result.success || !result.survey) {
                    return NextResponse.json({
                        error: 'Failed to parse LSS file',
                        details: result.errors,
                    }, { status: 400 });
                }

                surveyJSON = result.survey as SurveyJSON;
            } else if (fileName.endsWith('.json')) {
                surveyJSON = JSON.parse(content);
            } else {
                return NextResponse.json({
                    error: 'Unsupported file format. Please upload .json, .lss, or .xml files.',
                }, { status: 400 });
            }
        } else {
            // Assume JSON body
            surveyJSON = await request.json();
        }

        // Create survey
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .insert({
                title: surveyJSON.title,
                description: surveyJSON.description,
                status: surveyJSON.status || 'draft',
                settings: surveyJSON.settings || {},
            })
            .select()
            .single();

        if (surveyError) {
            return NextResponse.json({ error: surveyError.message }, { status: 500 });
        }

        // Create question groups
        for (const groupJSON of surveyJSON.question_groups) {
            const { data: group, error: groupError } = await supabase
                .from('question_groups')
                .insert({
                    survey_id: survey.id,
                    title: groupJSON.title,
                    description: groupJSON.description,
                    order_index: groupJSON.order_index,
                    relevance_logic: groupJSON.relevance_logic,
                    random_group: groupJSON.random_group,
                })
                .select()
                .single();

            if (groupError) {
                return NextResponse.json({ error: groupError.message }, { status: 500 });
            }

            // Create questions
            for (const questionJSON of groupJSON.questions) {
                const { data: question, error: questionError } = await supabase
                    .from('questions')
                    .insert({
                        group_id: group.id,
                        code: questionJSON.code,
                        question_text: questionJSON.question_text,
                        help_text: questionJSON.help_text,
                        question_type: questionJSON.question_type,
                        settings: questionJSON.settings || {},
                        relevance_logic: questionJSON.relevance_logic,
                        order_index: questionJSON.order_index,
                    })
                    .select()
                    .single();

                if (questionError) {
                    return NextResponse.json({ error: questionError.message }, { status: 500 });
                }

                // Create subquestions if present
                if (questionJSON.subquestions && questionJSON.subquestions.length > 0) {
                    const subquestions = questionJSON.subquestions.map(sq => ({
                        question_id: question.id,
                        code: sq.code,
                        label: sq.label,
                        order_index: sq.order_index,
                        relevance_logic: sq.relevance_logic,
                    }));

                    const { error: subqError } = await supabase
                        .from('subquestions')
                        .insert(subquestions);

                    if (subqError) {
                        return NextResponse.json({ error: subqError.message }, { status: 500 });
                    }
                }

                // Create answer options if present
                if (questionJSON.answer_options && questionJSON.answer_options.length > 0) {
                    const answerOptions = questionJSON.answer_options.map(opt => ({
                        question_id: question.id,
                        code: opt.code,
                        label: opt.label,
                        order_index: opt.order_index,
                        scale_id: opt.scale_id || 0,
                    }));

                    const { error: optError } = await supabase
                        .from('answer_options')
                        .insert(answerOptions);

                    if (optError) {
                        return NextResponse.json({ error: optError.message }, { status: 500 });
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            survey_id: survey.id,
            message: `Survey "${survey.title}" imported successfully`,
        });
    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
