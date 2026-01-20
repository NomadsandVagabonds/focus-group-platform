import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Update an answer option
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { code, answer_text } = body;

        const { data, error } = await supabase
            .from('answer_options')
            .update({
                code,
                answer_text,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Error updating answer option:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete an answer option
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('answer_options')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting answer option:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
