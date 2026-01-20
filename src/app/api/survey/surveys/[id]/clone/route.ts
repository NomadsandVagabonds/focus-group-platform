// API Route: Clone/Copy Survey
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const newTitle = body.title;

        // Fetch the original survey with full structure
        const { data: originalSurvey, error: fetchError } = await supabase
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

        if (fetchError || !originalSurvey) {
            return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
        }

        // Create the new survey
        const { data: newSurvey, error: surveyError } = await supabase
            .from('surveys')
            .insert({
                title: newTitle || `${originalSurvey.title} (Copy)`,
                description: originalSurvey.description,
                status: 'draft', // Always start as draft
                settings: {
                    ...originalSurvey.settings,
                    // Clear any integration codes since this is a new survey
                    prolific_integration: originalSurvey.settings?.prolific_integration 
                        ? {
                            ...originalSurvey.settings.prolific_integration,
                            completion_code: '',
                            screenout_code: '',
                        }
                        : undefined,
                    // Clear dates
                    start_date: undefined,
                    expiry_date: undefined,
                },
            })
            .select()
            .single();

        if (surveyError) {
            return NextResponse.json({ error: surveyError.message }, { status: 500 });
        }

        // Clone question groups
        const groupIdMap = new Map<string, string>();
        
        for (const group of originalSurvey.question_groups || []) {
            const { data: newGroup, error: groupError } = await supabase
                .from('question_groups')
                .insert({
                    survey_id: newSurvey.id,
                    title: group.title,
                    description: group.description,
                    order_index: group.order_index,
                    relevance_logic: group.relevance_logic,
                    random_group: group.random_group,
                })
                .select()
                .single();

            if (groupError) {
                console.error('Error cloning group:', groupError);
                continue;
            }

            groupIdMap.set(group.id, newGroup.id);

            // Clone questions
            for (const question of group.questions || []) {
                const { data: newQuestion, error: questionError } = await supabase
                    .from('questions')
                    .insert({
                        group_id: newGroup.id,
                        code: question.code,
                        question_text: question.question_text,
                        help_text: question.help_text,
                        question_type: question.question_type,
                        settings: question.settings,
                        relevance_logic: question.relevance_logic,
                        order_index: question.order_index,
                    })
                    .select()
                    .single();

                if (questionError) {
                    console.error('Error cloning question:', questionError);
                    continue;
                }

                // Clone subquestions
                if (question.subquestions && question.subquestions.length > 0) {
                    const subquestionInserts = question.subquestions.map((sq: any) => ({
                        question_id: newQuestion.id,
                        code: sq.code,
                        label: sq.label,
                        order_index: sq.order_index,
                        relevance_logic: sq.relevance_logic,
                    }));

                    const { error: sqError } = await supabase
                        .from('subquestions')
                        .insert(subquestionInserts);

                    if (sqError) {
                        console.error('Error cloning subquestions:', sqError);
                    }
                }

                // Clone answer options
                if (question.answer_options && question.answer_options.length > 0) {
                    const answerInserts = question.answer_options.map((opt: any) => ({
                        question_id: newQuestion.id,
                        code: opt.code,
                        label: opt.label,
                        order_index: opt.order_index,
                        scale_id: opt.scale_id,
                    }));

                    const { error: aoError } = await supabase
                        .from('answer_options')
                        .insert(answerInserts);

                    if (aoError) {
                        console.error('Error cloning answer options:', aoError);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            survey: newSurvey,
            message: `Survey "${newSurvey.title}" created successfully`,
        });

    } catch (error: any) {
        console.error('Clone error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
