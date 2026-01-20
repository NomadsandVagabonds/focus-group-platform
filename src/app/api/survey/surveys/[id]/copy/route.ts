// API Route: Copy/Clone Survey
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CopyRequestBody {
    title?: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Parse optional body for title override
        let body: CopyRequestBody = {};
        try {
            body = await request.json();
        } catch {
            // No body provided, use defaults
        }

        // Fetch original survey with full structure
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

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!originalSurvey) {
            return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
        }

        // Determine new title
        const newTitle = body.title || `Copy of ${originalSurvey.title}`;

        // Create new survey (status always 'draft')
        const { data: newSurvey, error: surveyError } = await supabase
            .from('surveys')
            .insert({
                title: newTitle,
                description: originalSurvey.description,
                status: 'draft',
                settings: originalSurvey.settings,
            })
            .select()
            .single();

        if (surveyError) {
            return NextResponse.json({ error: surveyError.message }, { status: 500 });
        }

        // Track created items for the response
        const createdGroups: any[] = [];

        // Copy question groups
        const questionGroups = originalSurvey.question_groups || [];

        // Sort groups by order_index to maintain order
        const sortedGroups = [...questionGroups].sort(
            (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
        );

        for (const originalGroup of sortedGroups) {
            // Create new group
            const { data: newGroup, error: groupError } = await supabase
                .from('question_groups')
                .insert({
                    survey_id: newSurvey.id,
                    title: originalGroup.title,
                    description: originalGroup.description,
                    order_index: originalGroup.order_index,
                    relevance_logic: originalGroup.relevance_logic,
                    random_group: originalGroup.random_group,
                })
                .select()
                .single();

            if (groupError) {
                // Cleanup: delete the new survey if group creation fails
                await supabase.from('surveys').delete().eq('id', newSurvey.id);
                return NextResponse.json({ error: groupError.message }, { status: 500 });
            }

            const createdQuestions: any[] = [];

            // Copy questions within the group
            const questions = originalGroup.questions || [];

            // Sort questions by order_index
            const sortedQuestions = [...questions].sort(
                (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
            );

            for (const originalQuestion of sortedQuestions) {
                // Create new question
                const { data: newQuestion, error: questionError } = await supabase
                    .from('questions')
                    .insert({
                        group_id: newGroup.id,
                        code: originalQuestion.code,
                        question_text: originalQuestion.question_text,
                        help_text: originalQuestion.help_text,
                        question_type: originalQuestion.question_type,
                        settings: originalQuestion.settings,
                        relevance_logic: originalQuestion.relevance_logic,
                        order_index: originalQuestion.order_index,
                    })
                    .select()
                    .single();

                if (questionError) {
                    // Cleanup: delete the new survey (cascade will handle groups/questions)
                    await supabase.from('surveys').delete().eq('id', newSurvey.id);
                    return NextResponse.json({ error: questionError.message }, { status: 500 });
                }

                const createdSubquestions: any[] = [];
                const createdAnswerOptions: any[] = [];

                // Copy subquestions
                const subquestions = originalQuestion.subquestions || [];
                if (subquestions.length > 0) {
                    // Sort by order_index
                    const sortedSubquestions = [...subquestions].sort(
                        (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
                    );

                    const subquestionInserts = sortedSubquestions.map((sq: any) => ({
                        question_id: newQuestion.id,
                        code: sq.code,
                        label: sq.label,
                        order_index: sq.order_index,
                        relevance_logic: sq.relevance_logic,
                    }));

                    const { data: newSubquestions, error: subqError } = await supabase
                        .from('subquestions')
                        .insert(subquestionInserts)
                        .select();

                    if (subqError) {
                        await supabase.from('surveys').delete().eq('id', newSurvey.id);
                        return NextResponse.json({ error: subqError.message }, { status: 500 });
                    }

                    createdSubquestions.push(...(newSubquestions || []));
                }

                // Copy answer options
                const answerOptions = originalQuestion.answer_options || [];
                if (answerOptions.length > 0) {
                    // Sort by order_index
                    const sortedOptions = [...answerOptions].sort(
                        (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
                    );

                    const optionInserts = sortedOptions.map((opt: any) => ({
                        question_id: newQuestion.id,
                        code: opt.code,
                        label: opt.label,
                        order_index: opt.order_index,
                        scale_id: opt.scale_id || 0,
                    }));

                    const { data: newOptions, error: optError } = await supabase
                        .from('answer_options')
                        .insert(optionInserts)
                        .select();

                    if (optError) {
                        await supabase.from('surveys').delete().eq('id', newSurvey.id);
                        return NextResponse.json({ error: optError.message }, { status: 500 });
                    }

                    createdAnswerOptions.push(...(newOptions || []));
                }

                createdQuestions.push({
                    ...newQuestion,
                    subquestions: createdSubquestions,
                    answer_options: createdAnswerOptions,
                });
            }

            createdGroups.push({
                ...newGroup,
                questions: createdQuestions,
            });
        }

        return NextResponse.json({
            success: true,
            survey: {
                ...newSurvey,
                question_groups: createdGroups,
            },
            message: `Survey "${newTitle}" created successfully`,
        });
    } catch (error: any) {
        console.error('Survey copy error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
