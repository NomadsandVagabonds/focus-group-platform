import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/sessions/[id]
 * Get session details with participants
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', id)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Get participants
        const { data: participants, error: participantsError } = await supabase
            .from('participants')
            .select('*')
            .eq('session_id', id)
            .order('created_at', { ascending: true });

        if (participantsError) throw participantsError;

        return NextResponse.json({
            session,
            participants: participants || []
        });

    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/sessions/[id]
 * Update session status or notes
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, moderatorNotes, name } = body;

        const updates: Record<string, unknown> = {};
        if (status) updates.status = status;
        if (moderatorNotes !== undefined) updates.moderator_notes = moderatorNotes;
        if (name) updates.name = name;

        const { data: session, error } = await supabase
            .from('sessions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ session });

    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json(
            { error: 'Failed to update session' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/sessions/[id]
 * Delete a session and all its participants
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json(
            { error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}
