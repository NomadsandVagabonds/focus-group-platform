// API Route: Save Survey Response Data
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


export async function POST(request: NextRequest) {
    try {
        const { response_id, question_code, subquestion_code, value } = await request.json();

        // Get question ID from code
        const { data: question } = await getSupabaseServer()
            .from('questions')
            .select('id')
            .eq('code', question_code)
            .single();

        if (!question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        let subquestion_id = null;
        if (subquestion_code) {
            const { data: subquestion } = await getSupabaseServer()
                .from('subquestions')
                .select('id')
                .eq('question_id', question.id)
                .eq('code', subquestion_code)
                .single();

            subquestion_id = subquestion?.id;
        }

        // Upsert response data
        const { data, error } = await getSupabaseServer()
            .from('response_data')
            .upsert({
                response_id,
                question_id: question.id,
                subquestion_id,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            }, {
                onConflict: 'response_id,question_id,subquestion_id',
            });

        if (error) {
            console.error('Error saving response:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error in response API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
