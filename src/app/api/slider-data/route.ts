import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for slider data (in production, use a database)
// Key: sessionId, Value: array of slider events
const sliderDataStore = new Map<string, SliderEvent[]>();

interface SliderEvent {
    participantId: string;
    timestamp: number;  // Absolute timestamp (Date.now())
    sessionTimestamp: number;  // Relative to session start (for video sync)
    value: number;
    mediaContextId?: string;
}

interface SessionMetadata {
    sessionId: string;
    startTime: number;
    endTime?: number;
    participantCount: number;
}

const sessionMetadata = new Map<string, SessionMetadata>();

export async function POST(request: NextRequest) {
    try {
        const { action, sessionId, events, participantId, value, startTime } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            );
        }

        if (action === 'start') {
            // Initialize session with start time
            const sessionStart = startTime || Date.now();
            sessionMetadata.set(sessionId, {
                sessionId,
                startTime: sessionStart,
                participantCount: 0,
            });
            sliderDataStore.set(sessionId, []);

            console.log(`[SliderData] Started session ${sessionId} at ${sessionStart}`);

            return NextResponse.json({
                success: true,
                sessionId,
                startTime: sessionStart,
            });
        } else if (action === 'record') {
            // Record a single slider event
            if (value === undefined || !participantId) {
                return NextResponse.json(
                    { error: 'participantId and value are required' },
                    { status: 400 }
                );
            }

            const session = sessionMetadata.get(sessionId);
            const sessionStart = session?.startTime || Date.now();
            const now = Date.now();

            const event: SliderEvent = {
                participantId,
                timestamp: now,
                sessionTimestamp: now - sessionStart,  // Relative for video sync
                value,
            };

            const existingData = sliderDataStore.get(sessionId) || [];
            existingData.push(event);
            sliderDataStore.set(sessionId, existingData);

            return NextResponse.json({ success: true, recorded: 1 });
        } else if (action === 'batch') {
            // Record multiple slider events at once
            if (!events || !Array.isArray(events)) {
                return NextResponse.json(
                    { error: 'events array is required' },
                    { status: 400 }
                );
            }

            const session = sessionMetadata.get(sessionId);
            const sessionStart = session?.startTime || Date.now();

            const existingData = sliderDataStore.get(sessionId) || [];
            const newEvents: SliderEvent[] = events.map((e: any) => ({
                participantId: e.participantId,
                timestamp: e.timestamp || Date.now(),
                sessionTimestamp: (e.timestamp || Date.now()) - sessionStart,
                value: e.value,
                mediaContextId: e.mediaContextId,
            }));

            existingData.push(...newEvents);
            sliderDataStore.set(sessionId, existingData);

            return NextResponse.json({ success: true, recorded: newEvents.length });
        } else if (action === 'export') {
            // Export all slider data for a session
            const data = sliderDataStore.get(sessionId) || [];
            const metadata = sessionMetadata.get(sessionId);

            return NextResponse.json({
                sessionId,
                metadata,
                eventCount: data.length,
                events: data,
            });
        } else if (action === 'stop') {
            // Mark session as ended
            const metadata = sessionMetadata.get(sessionId);
            if (metadata) {
                metadata.endTime = Date.now();
                sessionMetadata.set(sessionId, metadata);
            }

            const data = sliderDataStore.get(sessionId) || [];
            console.log(`[SliderData] Stopped session ${sessionId} with ${data.length} events`);

            return NextResponse.json({
                success: true,
                sessionId,
                eventCount: data.length,
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "start", "record", "batch", "export", or "stop"' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('[SliderData] Error:', error);
        return NextResponse.json(
            { error: 'Slider data operation failed' },
            { status: 500 }
        );
    }
}
