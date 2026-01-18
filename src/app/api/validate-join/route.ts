import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/validate-join
 * Validates session code + participant code pair
 * Returns session/participant IDs if valid
 */
export async function POST(request: NextRequest) {
    try {
        const { sessionCode, participantCode } = await request.json();

        if (!sessionCode || !participantCode) {
            return NextResponse.json(
                { error: 'Session code and participant code are required' },
                { status: 400 }
            );
        }

        // Find the session by code
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('id, name, status')
            .eq('code', sessionCode.toUpperCase())
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Invalid session code' },
                { status: 404 }
            );
        }

        // Check session status
        if (session.status === 'completed') {
            return NextResponse.json(
                { error: 'This session has already ended' },
                { status: 403 }
            );
        }

        // Find the participant by code within this session
        const { data: participant, error: participantError } = await supabase
            .from('participants')
            .select('id, display_name, notes, metadata')
            .eq('session_id', session.id)
            .eq('code', participantCode.toUpperCase())
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                { error: 'Invalid participant code' },
                { status: 404 }
            );
        }

        // Valid! Return session and participant info
        return NextResponse.json({
            valid: true,
            sessionId: session.id,
            sessionName: session.name,
            participantId: participant.id,
            displayName: participant.display_name,
            notes: participant.notes,
            metadata: participant.metadata,
        });

    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
