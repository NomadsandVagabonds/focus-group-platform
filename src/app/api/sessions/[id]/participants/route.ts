import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/sessions/[id]/participants
 * Add participants to a session (bulk create)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params;
        const body = await request.json();
        const { participants } = body;

        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return NextResponse.json(
                { error: 'Participants array is required' },
                { status: 400 }
            );
        }

        // Verify session exists
        const { data: session, error: sessionError } = await getSupabaseServer()
            .from('sessions')
            .select('id')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Create participant records with auto-generated codes
        const participantRecords = participants.map((p: {
            name?: string;
            display_name?: string;
            email?: string;
            notes?: string;
            metadata?: Record<string, unknown>
        }) => ({
            session_id: sessionId,
            code: generateParticipantCode(),
            display_name: p.display_name || p.name || null,
            email: p.email || null,
            notes: p.notes || null,
            metadata: {
                ...p.metadata,
                name: p.name || null  // Store legal name in metadata
            }
        }));

        const { data: created, error: createError } = await getSupabaseServer()
            .from('participants')
            .insert(participantRecords)
            .select();

        if (createError) throw createError;

        // Generate invite URLs for each participant
        const baseUrl = request.headers.get('origin') || 'http://localhost:3000';

        // Get the session code from the database
        const { data: sessionData } = await getSupabaseServer()
            .from('sessions')
            .select('code')
            .eq('id', sessionId)
            .single();

        const participantsWithUrls = (created || []).map(p => ({
            ...p,
            inviteUrl: `${baseUrl}/join/${sessionData?.code}?p=${p.code}`
        }));

        return NextResponse.json({
            participants: participantsWithUrls
        });

    } catch (error) {
        console.error('Error creating participants:', error);
        return NextResponse.json(
            { error: 'Failed to create participants' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/sessions/[id]/participants
 * List all participants for a session
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params;

        const { data: participants, error } = await getSupabaseServer()
            .from('participants')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({
            participants: participants || []
        });

    } catch (error) {
        console.error('Error fetching participants:', error);
        return NextResponse.json(
            { error: 'Failed to fetch participants' },
            { status: 500 }
        );
    }
}

/**
 * Generate a participant code like "XYZ789"
 */
function generateParticipantCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
