import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/test-db
 * Tests Supabase connection and creates a sample session
 */
export async function GET() {
    try {
        // Test 1: Create a sample session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
                name: 'Test Session',
                code: 'TEST-001',
                status: 'scheduled',
                moderator_notes: 'This is a test session'
            })
            .select()
            .single();

        if (sessionError) {
            // If it already exists, just fetch it
            if (sessionError.code === '23505') {
                const { data: existingSession } = await supabase
                    .from('sessions')
                    .select('*')
                    .eq('code', 'TEST-001')
                    .single();

                return NextResponse.json({
                    success: true,
                    message: 'Database connected! Test session already exists.',
                    session: existingSession
                });
            }
            throw sessionError;
        }

        // Test 2: Create a sample participant
        const { data: participant, error: participantError } = await supabase
            .from('participants')
            .insert({
                session_id: session.id,
                code: 'ABC123',
                email: 'test@example.com',
                notes: 'Test participant'
            })
            .select()
            .single();

        if (participantError && participantError.code !== '23505') {
            throw participantError;
        }

        return NextResponse.json({
            success: true,
            message: 'Database connected and test data created!',
            session,
            participant
        });

    } catch (error) {
        console.error('Database test error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                details: error
            },
            { status: 500 }
        );
    }
}
