import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/sessions
 * List all sessions OR look up one by code (?code=XXX)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        // If code is provided, look up single session
        if (code) {
            const { data: session, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('code', code.toUpperCase())
                .single();

            if (error || !session) {
                return NextResponse.json(
                    { error: 'Session not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(session);
        }

        // Otherwise list all sessions
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
 * Generate cryptographically secure random characters from a charset
 */
function generateSecureCode(length: number, charset: string): string {
    const bytes = randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset[bytes[i] % charset.length];
    }
    return result;
}

/**
 * Generate a session code like "ABC-123"
 * Uses crypto.randomBytes for security
 */
function generateSessionCode(): string {
    // Removed ambiguous characters: I, O, 0, 1
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';

    const letterPart = generateSecureCode(3, letters);
    const numberPart = generateSecureCode(3, numbers);

    return `${letterPart}-${numberPart}`;
}

/**
 * Generate a participant code like "XYZ789"
 * Uses crypto.randomBytes for security
 */
function generateParticipantCode(): string {
    // Removed ambiguous characters: I, O, 0, 1
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return generateSecureCode(6, chars);
}
