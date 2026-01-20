// API Route: Export Survey to JSON
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import type { SurveyJSON, QuestionGroupJSON, QuestionJSON } from '@/lib/survey/survey-json-schema';


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Fetch survey with full structure
        const { data: survey, error } = await supabase
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
            .eq('id', id)
            .single();

        if (error || !survey) {
            return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
        }

        // Convert to JSON schema format
        const surveyJSON: SurveyJSON = {
            title: survey.title,
            description: survey.description,
            status: survey.status,
            settings: survey.settings,
            question_groups: survey.question_groups
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((group: any): QuestionGroupJSON => ({
                    title: group.title,
                    description: group.description,
                    order_index: group.order_index,
                    relevance_logic: group.relevance_logic,
                    random_group: group.random_group,
                    questions: group.questions
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((question: any): QuestionJSON => ({
                            code: question.code,
                            question_text: question.question_text,
                            help_text: question.help_text,
                            question_type: question.question_type,
                            settings: question.settings,
                            relevance_logic: question.relevance_logic,
                            order_index: question.order_index,
                            subquestions: question.subquestions
                                ?.sort((a: any, b: any) => a.order_index - b.order_index)
                                .map((sq: any) => ({
                                    code: sq.code,
                                    label: sq.label,
                                    order_index: sq.order_index,
                                    relevance_logic: sq.relevance_logic,
                                })),
                            answer_options: question.answer_options
                                ?.sort((a: any, b: any) => a.order_index - b.order_index)
                                .map((opt: any) => ({
                                    code: opt.code,
                                    label: opt.label,
                                    order_index: opt.order_index,
                                    scale_id: opt.scale_id,
                                })),
                        })),
                })),
        };

        // Return as downloadable JSON file
        return new NextResponse(JSON.stringify(surveyJSON, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json"`,
            },
        });
    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
