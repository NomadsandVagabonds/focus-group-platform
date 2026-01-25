// API Route: Questions Update by ID
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        console.log('[API] PUT /api/survey/questions/', id);

        const body = await request.json();
        const { subquestions, answer_options, id: _id, ...questionData } = body;
        console.log('[API] Question data to update:', Object.keys(questionData));

        // Update question
        const { data: question, error: questionError } = await getSupabaseServer()
            .from('questions')
            .update(questionData)
            .eq('id', id)
            .select()
            .single();

        if (questionError) {
            console.error('[API] Supabase error:', questionError);
            return NextResponse.json({ error: questionError.message }, { status: 500 });
        }

        console.log('[API] Question updated successfully');

        // Handle subquestions if provided
        if (subquestions !== undefined) {
            // Delete existing subquestions
            await getSupabaseServer()
                .from('subquestions')
                .delete()
                .eq('question_id', id);

            // Insert new subquestions
            if (subquestions && subquestions.length > 0) {
                const subquestionsToInsert = subquestions.map((sq: any, idx: number) => ({
                    code: sq.code,
                    label: sq.label,
                    order_index: sq.order_index ?? idx,
                    question_id: id,
                }));

                await getSupabaseServer().from('subquestions').insert(subquestionsToInsert);
            }
        }

        // Handle answer options if provided
        if (answer_options !== undefined) {
            // Delete existing answer options
            await getSupabaseServer()
                .from('answer_options')
                .delete()
                .eq('question_id', id);

            // Insert new answer options
            if (answer_options && answer_options.length > 0) {
                const optionsToInsert = answer_options.map((opt: any, idx: number) => ({
                    code: opt.code,
                    label: opt.label,
                    order_index: opt.order_index ?? idx,
                    question_id: id,
                }));

                await getSupabaseServer().from('answer_options').insert(optionsToInsert);
            }
        }

        return NextResponse.json({ success: true, data: question });
    } catch (error: any) {
        console.error('Question update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: question, error } = await getSupabaseServer()
            .from('questions')
            .select(`
                *,
                subquestions (id, code, label, order_index),
                answer_options (id, code, label, order_index)
            `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(question);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
