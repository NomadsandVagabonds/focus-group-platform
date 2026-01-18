import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'devsecret';
const MODERATOR_SECRET = process.env.MODERATOR_SECRET || '';

export async function POST(request: NextRequest) {
    try {
        const { roomName, participantName, isModerator, moderatorSecret } = await request.json();

        if (!roomName || !participantName) {
            return NextResponse.json(
                { error: 'roomName and participantName are required' },
                { status: 400 }
            );
        }

        // SECURITY: Verify moderator status with secret, not just client flag
        // Prevents privilege escalation where any user could claim isModerator: true
        const isActualModerator = isModerator === true &&
            MODERATOR_SECRET !== '' &&
            moderatorSecret === MODERATOR_SECRET;

        if (isModerator && !isActualModerator) {
            console.warn('[Token] Rejected moderator request - invalid or missing secret');
            return NextResponse.json(
                { error: 'Invalid moderator credentials' },
                { status: 403 }
            );
        }

        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: participantName,
            ttl: '6h', // 6 hour sessions for focus groups
        });

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            // Moderators get additional permissions - only if verified
            roomAdmin: isActualModerator,
            roomRecord: isActualModerator,
        });

        const token = await at.toJwt();

        return NextResponse.json({ token });
    } catch (error) {
        console.error('[Token] Error generating token:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
