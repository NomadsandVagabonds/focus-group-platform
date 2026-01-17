import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

// These would come from environment variables in production
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'devsecret';

export async function POST(request: NextRequest) {
    try {
        const { roomName, participantName, isModerator } = await request.json();

        if (!roomName || !participantName) {
            return NextResponse.json(
                { error: 'roomName and participantName are required' },
                { status: 400 }
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
            // Moderators get additional permissions
            roomAdmin: isModerator || false,
            roomRecord: isModerator || false,
        });

        const token = await at.toJwt();

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Error generating token:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
