import { NextRequest, NextResponse } from 'next/server';
import {
    EgressClient,
    EncodedFileOutput,
    EncodedFileType,
    RoomCompositeEgressRequest,
} from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

// Convert wss:// to https:// for API calls
const getApiHost = () => {
    const url = LIVEKIT_URL.replace('wss://', 'https://');
    return url;
};

// Store active egress IDs per room (in production, use a database)
const activeRecordings = new Map<string, string>();

// Store session start times for timestamp synchronization
const sessionStartTimes = new Map<string, number>();

export async function POST(request: NextRequest) {
    try {
        const { action, roomName, sessionId } = await request.json();

        if (!roomName) {
            return NextResponse.json(
                { error: 'roomName is required' },
                { status: 400 }
            );
        }

        const egressClient = new EgressClient(
            getApiHost(),
            LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET
        );

        if (action === 'start') {
            // Check if already recording
            if (activeRecordings.has(roomName)) {
                return NextResponse.json(
                    { error: 'Recording already in progress', egressId: activeRecordings.get(roomName) },
                    { status: 409 }
                );
            }

            // Record session start time for timestamp sync
            const startTime = Date.now();
            sessionStartTimes.set(roomName, startTime);

            // Start room composite recording
            // Uses LiveKit's default grid layout, outputs to LiveKit's managed storage
            const egress = await egressClient.startRoomCompositeEgress(
                roomName,
                {
                    file: new EncodedFileOutput({
                        fileType: EncodedFileType.MP4,
                        filepath: `recordings/${sessionId || roomName}/{room_name}-{time}.mp4`,
                    }),
                },
                {
                    layout: 'grid-dark', // Dark theme matches our video UI
                    audioOnly: false,
                    videoOnly: false,
                }
            );

            activeRecordings.set(roomName, egress.egressId);

            console.log(`[Recording] Started egress ${egress.egressId} for room ${roomName}`);

            return NextResponse.json({
                success: true,
                egressId: egress.egressId,
                startTime,
                message: 'Recording started',
            });
        } else if (action === 'stop') {
            const egressId = activeRecordings.get(roomName);

            if (!egressId) {
                return NextResponse.json(
                    { error: 'No active recording for this room' },
                    { status: 404 }
                );
            }

            // Stop the egress
            await egressClient.stopEgress(egressId);

            const startTime = sessionStartTimes.get(roomName);
            const endTime = Date.now();
            const duration = startTime ? endTime - startTime : 0;

            activeRecordings.delete(roomName);
            sessionStartTimes.delete(roomName);

            console.log(`[Recording] Stopped egress ${egressId} for room ${roomName}`);

            return NextResponse.json({
                success: true,
                egressId,
                startTime,
                endTime,
                durationMs: duration,
                message: 'Recording stopped',
            });
        } else if (action === 'status') {
            const egressId = activeRecordings.get(roomName);

            if (!egressId) {
                return NextResponse.json({
                    isRecording: false,
                    roomName,
                });
            }

            // Get egress info
            const egresses = await egressClient.listEgress({ roomName });
            const currentEgress = egresses.find(e => e.egressId === egressId);

            return NextResponse.json({
                isRecording: true,
                egressId,
                roomName,
                startTime: sessionStartTimes.get(roomName),
                status: currentEgress?.status,
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "start", "stop", or "status"' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('[Recording] Error:', error);
        return NextResponse.json(
            { error: 'Recording operation failed', details: String(error) },
            { status: 500 }
        );
    }
}
