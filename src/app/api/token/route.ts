import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'devsecret';
const MODERATOR_SECRET = process.env.MODERATOR_SECRET || '';

export async function POST(request: NextRequest) {
    try {
        const { roomName, participantName, isModerator, isObserver, moderatorSecret } = await request.json();

        if (!roomName) {
            return NextResponse.json(
                { error: 'roomName is required' },
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

        // Observer mode: can watch but not publish
        const isObserverMode = isObserver === true;

        // Generate identity based on role
        let identity = participantName;
        if (!identity) {
            if (isObserverMode) {
                identity = `observer-${Math.random().toString(36).substring(2, 8)}`;
            } else {
                return NextResponse.json(
                    { error: 'participantName is required' },
                    { status: 400 }
                );
            }
        }

        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: identity,
            ttl: '6h', // 6 hour sessions for focus groups
        });

        at.addGrant({
            roomJoin: true,
            room: roomName,
            // Observers can only subscribe, not publish
            canPublish: !isObserverMode,
            canSubscribe: true,
            canPublishData: !isObserverMode,
            // Moderators get additional permissions - only if verified
            roomAdmin: isActualModerator,
            roomRecord: isActualModerator,
            // Mark observers as hidden from participant list (optional)
            hidden: isObserverMode,
        });

        const token = await at.toJwt();

        console.log(`[Token] Generated ${isObserverMode ? 'observer' : isActualModerator ? 'moderator' : 'participant'} token for ${identity} in ${roomName}`);

        return NextResponse.json({ token, identity });
    } catch (error) {
        console.error('[Token] Error generating token:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
