import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/sessions
 * List all sessions
 */
export async function GET() {
    try {
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sessions
 * Create a new session with optional participants
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, scheduledAt, moderatorNotes, participants } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Session name is required' },
                { status: 400 }
            );
        }

        // Generate a unique session code (like Zoom)
        const code = generateSessionCode();

        // Create the session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
                name,
                code,
                status: 'scheduled',
                moderator_notes: moderatorNotes || null,
                scheduled_at: scheduledAt || null
            })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // If participants provided, create them
        let createdParticipants: unknown[] = [];
        if (participants && participants.length > 0) {
            const participantRecords = participants.map((p: { email?: string; notes?: string; metadata?: Record<string, unknown> }) => ({
                session_id: session.id,
                code: generateParticipantCode(),
                email: p.email || null,
                notes: p.notes || null,
                metadata: p.metadata || {}
            }));

            const { data: created, error: participantError } = await supabase
                .from('participants')
                .insert(participantRecords)
                .select();

            if (participantError) throw participantError;
            createdParticipants = created || [];
        }

        // Always create backup participant slots (BACKUP1-BACKUP5)
        const backupParticipants = [];
        for (let i = 1; i <= 5; i++) {
            backupParticipants.push({
                session_id: session.id,
                code: `BACKUP${i}`,
                display_name: `Backup ${i}`,
                notes: 'Emergency backup slot - assign to participant if their code fails',
                metadata: { isBackup: true }
            });
        }

        const { data: backups, error: backupError } = await supabase
            .from('participants')
            .insert(backupParticipants)
            .select();

        if (backupError) {
            console.error('Failed to create backup participants:', backupError);
            // Don't fail the session creation, just log
        }

        return NextResponse.json({
            session,
            participants: createdParticipants,
            backups: backups || []
        });

    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}

/**
 * Generate a session code like "ABC-123"
 */
function generateSessionCode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let code = '';
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    code += '-';
    for (let i = 0; i < 3; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return code;
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
