import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


// Update a subquestion
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { code, label } = body;

        const { data, error } = await supabase
            .from('subquestions')
            .update({
                code,
                label,
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
        console.error('Error updating subquestion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete a subquestion
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('subquestions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting subquestion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
