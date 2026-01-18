import { NextRequest, NextResponse } from 'next/server';
import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

// S3 Configuration
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Convert wss:// to https:// for API calls
const getApiHost = () => {
    return LIVEKIT_URL.replace('wss://', 'https://');
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

        // Validate environment variables
        if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
            console.error('[Recording] Missing LiveKit environment variables');
            return NextResponse.json(
                { error: 'Server configuration error: missing LiveKit credentials' },
                { status: 500 }
            );
        }

        // Validate S3 credentials for recording
        if (action === 'start' && (!AWS_ACCESS_KEY || !AWS_SECRET_KEY || !AWS_S3_BUCKET)) {
            console.error('[Recording] Missing S3 environment variables:', {
                hasAccessKey: !!AWS_ACCESS_KEY,
                hasSecretKey: !!AWS_SECRET_KEY,
                hasBucket: !!AWS_S3_BUCKET,
            });
            return NextResponse.json(
                { error: 'Server configuration error: missing S3 storage credentials. Please configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.' },
                { status: 500 }
            );
        }

        const egressClient = new EgressClient(getApiHost(), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

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

            console.log(`[Recording] Starting egress for room ${roomName}`);

            // Create S3 upload configuration
            const s3Upload = new S3Upload({
                accessKey: AWS_ACCESS_KEY,
                secret: AWS_SECRET_KEY,
                bucket: AWS_S3_BUCKET,
                region: AWS_REGION,
            });

            // Create file output with S3 destination
            const fileOutput = new EncodedFileOutput({
                fileType: EncodedFileType.MP4,
                filepath: `resonant/${sessionId || roomName}/{room_name}-{time}.mp4`,
                output: {
                    case: 's3',
                    value: s3Upload,
                },
            });

            // Start room composite recording
            const egress = await egressClient.startRoomCompositeEgress(
                roomName,
                { file: fileOutput },
                {
                    layout: 'grid-dark',
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
                s3Path: `s3://${AWS_S3_BUCKET}/resonant/${sessionId || roomName}/`,
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
                message: 'Recording stopped. File will be available in S3 shortly.',
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
