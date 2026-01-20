// API Route: Edit Response Data (Admin only)
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


interface UpdateItem {
    question_id: string;
    subquestion_id?: string;
    value: string;
}

// PUT - Admin edit of response values
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: responseId } = await params;
        const body = await request.json();
        const { updates } = body as { updates: UpdateItem[] };

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
        }

        // Verify response exists
        const { data: response, error: checkError } = await supabase
            .from('survey_responses')
            .select('id')
            .eq('id', responseId)
            .single();

        if (checkError || !response) {
            return NextResponse.json({ error: 'Response not found' }, { status: 404 });
        }

        // Process each update
        for (const update of updates) {
            // First, try to find existing response_data entry
            const query = supabase
                .from('response_data')
                .select('id')
                .eq('response_id', responseId)
                .eq('question_id', update.question_id);

            if (update.subquestion_id) {
                query.eq('subquestion_id', update.subquestion_id);
            } else {
                query.is('subquestion_id', null);
            }

            const { data: existing } = await query.single();

            if (existing) {
                // Update existing record
                if (update.value) {
                    await supabase
                        .from('response_data')
                        .update({ value: update.value })
                        .eq('id', existing.id);
                } else {
                    // Delete if value is empty
                    await supabase
                        .from('response_data')
                        .delete()
                        .eq('id', existing.id);
                }
            } else if (update.value) {
                // Insert new record if value is not empty
                await supabase
                    .from('response_data')
                    .insert({
                        response_id: responseId,
                        question_id: update.question_id,
                        subquestion_id: update.subquestion_id || null,
                        value: update.value,
                    });
            }
        }

        // Return success
        return NextResponse.json({
            success: true,
            message: 'Response updated successfully'
        });
    } catch (error: any) {
        console.error('Error editing response:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
