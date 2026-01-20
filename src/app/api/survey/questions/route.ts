// API Route: Questions CRUD
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { subquestions, answer_options, ...questionData } = body;

        // Insert question
        const { data: question, error: questionError } = await supabase
            .from('questions')
            .insert(questionData)
            .select()
            .single();

        if (questionError) {
            return NextResponse.json({ error: questionError.message }, { status: 500 });
        }

        // Insert subquestions if provided
        if (subquestions && subquestions.length > 0) {
            const subquestionsToInsert = subquestions.map((sq: any) => ({
                ...sq,
                question_id: question.id,
                id: undefined, // Remove temp ID
            }));

            await getSupabaseServer().from('subquestions').insert(subquestionsToInsert);
        }

        // Insert answer options if provided
        if (answer_options && answer_options.length > 0) {
            const optionsToInsert = answer_options.map((opt: any) => ({
                ...opt,
                question_id: question.id,
                id: undefined, // Remove temp ID
            }));

            await getSupabaseServer().from('answer_options').insert(optionsToInsert);
        }

        return NextResponse.json({ success: true, data: question });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
