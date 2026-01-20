// API Route: Single Label Set Operations
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


// GET /api/survey/label-sets/[id] - Get single label set
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: labelSet, error } = await supabase
            .from('label_sets')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !labelSet) {
            return NextResponse.json({ error: 'Label set not found' }, { status: 404 });
        }

        return NextResponse.json({ labelSet });
    } catch (error: any) {
        console.error('Error fetching label set:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/survey/label-sets/[id] - Delete label set
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('label_sets')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting label set:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/survey/label-sets/[id] - Update label set
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, language, labels } = body;

        const { data: labelSet, error } = await supabase
            .from('label_sets')
            .update({
                name,
                language,
                labels,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ labelSet });
    } catch (error: any) {
        console.error('Error updating label set:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
