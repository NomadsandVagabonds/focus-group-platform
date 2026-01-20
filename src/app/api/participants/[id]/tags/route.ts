import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// GET: Get tags for a participant
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const supabase = getSupabase();
        const { data, error } = await getSupabaseServer()
            .from('participant_tags')
            .select(`
                id,
                tag:tags(id, name, color)
            `)
            .eq('participant_id', id);

        if (error) throw error;

        // Flatten the response
        const tags = data?.map(pt => pt.tag) || [];
        return NextResponse.json(tags);
    } catch (error) {
        console.error('Error fetching participant tags:', error);
        return NextResponse.json([], { status: 200 }); // Return empty if table doesn't exist
    }
}

// PUT: Set tags for a participant (replaces existing)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const supabase = getSupabase();
        const { tagIds } = await request.json();

        if (!Array.isArray(tagIds)) {
            return NextResponse.json({ error: 'tagIds must be an array' }, { status: 400 });
        }

        // Delete existing tags for this participant
        await getSupabaseServer()
            .from('participant_tags')
            .delete()
            .eq('participant_id', id);

        // Insert new tags
        if (tagIds.length > 0) {
            const { error: insertError } = await getSupabaseServer()
                .from('participant_tags')
                .insert(tagIds.map((tagId: string) => ({
                    participant_id: id,
                    tag_id: tagId
                })));

            if (insertError) throw insertError;
        }

        // Return updated tags
        const { data } = await getSupabaseServer()
            .from('participant_tags')
            .select(`tag:tags(id, name, color)`)
            .eq('participant_id', id);

        const tags = data?.map(pt => pt.tag) || [];
        return NextResponse.json(tags);
    } catch (error) {
        console.error('Error updating participant tags:', error);
        return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
    }
}

