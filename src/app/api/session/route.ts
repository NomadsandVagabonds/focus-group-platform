import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory session store (would be database in production)
const sessions = new Map<string, {
    id: string;
    name: string;
    createdAt: Date;
    moderatorId: string;
    status: 'waiting' | 'active' | 'recording' | 'ended';
    participantCount: number;
}>();

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('id');

    if (sessionId) {
        const session = sessions.get(sessionId);
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }
        return NextResponse.json(session);
    }

    // Return all active sessions
    const activeSessions = Array.from(sessions.values()).filter(
        (s) => s.status !== 'ended'
    );
    return NextResponse.json(activeSessions);
}

export async function POST(request: NextRequest) {
    try {
        const { name, moderatorId } = await request.json();

        if (!name || !moderatorId) {
            return NextResponse.json(
                { error: 'name and moderatorId are required' },
                { status: 400 }
            );
        }

        const session = {
            id: uuidv4(),
            name,
            createdAt: new Date(),
            moderatorId,
            status: 'waiting' as const,
            participantCount: 0,
        };

        sessions.set(session.id, session);

        return NextResponse.json(session);
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { id, status } = await request.json();

        const session = sessions.get(id);
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        session.status = status;
        sessions.set(id, session);

        return NextResponse.json(session);
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json(
            { error: 'Failed to update session' },
            { status: 500 }
        );
    }
}
