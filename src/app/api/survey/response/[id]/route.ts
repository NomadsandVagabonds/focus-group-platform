// API Route: Individual Response Operations (GET, PUT, DELETE)
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


// GET - Fetch a single response with its data
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: response, error } = await getSupabaseServer()
            .from('survey_responses')
            .select(`
                *,
                response_data (*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Response not found' }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: response });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Update a response's data
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Update the response record itself (status, metadata, etc.)
        if (body.status || body.metadata) {
            const updateData: any = {};
            if (body.status) updateData.status = body.status;
            if (body.metadata) updateData.metadata = body.metadata;

            const { error: responseError } = await getSupabaseServer()
                .from('survey_responses')
                .update(updateData)
                .eq('id', id);

            if (responseError) {
                return NextResponse.json({ error: responseError.message }, { status: 500 });
            }
        }

        // Update response data if provided
        if (body.response_data && Array.isArray(body.response_data)) {
            for (const item of body.response_data) {
                if (item.id) {
                    // Update existing response data
                    const { error: dataError } = await getSupabaseServer()
                        .from('response_data')
                        .update({ value: item.value })
                        .eq('id', item.id);

                    if (dataError) {
                        console.error('Error updating response data:', dataError);
                    }
                } else if (item.question_id && item.value !== undefined) {
                    // Upsert new response data
                    const { error: upsertError } = await getSupabaseServer()
                        .from('response_data')
                        .upsert({
                            response_id: id,
                            question_id: item.question_id,
                            subquestion_id: item.subquestion_id,
                            value: item.value
                        }, {
                            onConflict: 'response_id,question_id,subquestion_id'
                        });

                    if (upsertError) {
                        console.error('Error upserting response data:', upsertError);
                    }
                }
            }
        }

        // Fetch the updated response
        const { data: updatedResponse, error: fetchError } = await getSupabaseServer()
            .from('survey_responses')
            .select(`
                *,
                response_data (*)
            `)
            .eq('id', id)
            .single();

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        return NextResponse.json({ data: updatedResponse });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Remove a response and all its data
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // First delete all response_data for this response
        const { error: dataError } = await getSupabaseServer()
            .from('response_data')
            .delete()
            .eq('response_id', id);

        if (dataError) {
            console.error('Error deleting response data:', dataError);
            // Continue even if this fails - the cascade delete might handle it
        }

        // Then delete the response itself
        const { error: responseError } = await getSupabaseServer()
            .from('survey_responses')
            .delete()
            .eq('id', id);

        if (responseError) {
            return NextResponse.json({ error: responseError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Response deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
