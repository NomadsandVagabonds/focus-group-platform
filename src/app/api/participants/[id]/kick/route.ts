import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

const livekitHost = process.env.LIVEKIT_URL?.replace('wss://', 'https://') || '';
const apiKey = process.env.LIVEKIT_API_KEY || '';
const apiSecret = process.env.LIVEKIT_API_SECRET || '';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * POST /api/participants/[id]/kick
 * Remove a participant from their LiveKit room
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const supabase = getSupabase();

        // Get participant and their session
        const { data: participant, error: participantError } = await getSupabaseServer()
            .from('participants')
            .select('code, session_id')
            .eq('id', id)
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                { error: 'Participant not found' },
                { status: 404 }
            );
        }

        // Get session code (used as room name)
        const { data: session, error: sessionError } = await getSupabaseServer()
            .from('sessions')
            .select('code')
            .eq('id', participant.session_id)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Create RoomServiceClient and kick the participant
        const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

        try {
            await roomService.removeParticipant(session.code, participant.code);
        } catch (roomError) {
            // If participant isn't in the room, that's okay - they may have already left
            console.warn('[Kick] Participant may not be in room:', roomError);
        }

        return NextResponse.json({
            success: true,
            message: 'Participant removed from session'
        });

    } catch (error) {
        console.error('[Kick] Error removing participant:', error);
        return NextResponse.json(
            { error: 'Failed to remove participant' },
            { status: 500 }
        );
    }
}
