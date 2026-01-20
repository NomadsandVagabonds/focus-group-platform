import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * PATCH /api/participants/[id]
 * Update a participant's notes or display name
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { notes, displayName, email, metadata } = body;

        const updates: Record<string, unknown> = {};
        if (notes !== undefined) updates.notes = notes;
        if (displayName !== undefined) updates.display_name = displayName;
        if (email !== undefined) updates.email = email;
        if (metadata !== undefined) updates.metadata = metadata;

        const { data: participant, error } = await getSupabaseServer()
            .from('participants')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ participant });

    } catch (error) {
        console.error('Error updating participant:', error);
        return NextResponse.json(
            { error: 'Failed to update participant' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/participants/[id]
 * Remove a participant
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await getSupabaseServer()
            .from('participants')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting participant:', error);
        return NextResponse.json(
            { error: 'Failed to delete participant' },
            { status: 500 }
        );
    }
}
