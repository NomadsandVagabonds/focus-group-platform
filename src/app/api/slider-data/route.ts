import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface SliderEvent {
    participantId: string;
    timestamp: number;      // Absolute timestamp (Date.now())
    sessionMs: number;      // Relative to session start (for video sync)
    value: number;
    mediaContextId?: string;
}

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
            // Mark recording start time on session
            const sessionStart = startTime || Date.now();

            const { error } = await supabase
                .from('sessions')
                .update({ recording_start_time: sessionStart })
                .eq('id', sessionId);

            if (error) {
                console.error('[SliderData] Error starting session:', error);
                // Don't fail - session might not exist in DB yet
            }

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

            // Get session start time
            const { data: session } = await supabase
                .from('sessions')
                .select('recording_start_time')
                .eq('id', sessionId)
                .single();

            const sessionStart = session?.recording_start_time || Date.now();
            const now = Date.now();

            const { error } = await supabase
                .from('slider_events')
                .insert({
                    session_id: sessionId,
                    participant_id: participantId,
                    value,
                    timestamp: now,
                    session_ms: now - sessionStart,
                });

            if (error) {
                console.error('[SliderData] Error recording event:', error);
                return NextResponse.json(
                    { error: 'Failed to record slider event' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true, recorded: 1 });

        } else if (action === 'batch') {
            // Record multiple slider events at once (for buffered sends)
            if (!events || !Array.isArray(events)) {
                return NextResponse.json(
                    { error: 'events array is required' },
                    { status: 400 }
                );
            }

            // Get session start time
            const { data: session } = await supabase
                .from('sessions')
                .select('recording_start_time')
                .eq('id', sessionId)
                .single();

            const sessionStart = session?.recording_start_time || Date.now();

            const rows = events.map((e: any) => ({
                session_id: sessionId,
                participant_id: e.participantId,
                value: e.value,
                timestamp: e.timestamp || Date.now(),
                session_ms: (e.timestamp || Date.now()) - sessionStart,
            }));

            const { error } = await supabase
                .from('slider_events')
                .insert(rows);

            if (error) {
                console.error('[SliderData] Error batch recording:', error);
                return NextResponse.json(
                    { error: 'Failed to batch record slider events' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true, recorded: rows.length });

        } else if (action === 'export') {
            // Export all slider data for a session
            const { data: session } = await supabase
                .from('sessions')
                .select('id, recording_start_time, recording_end_time')
                .eq('id', sessionId)
                .single();

            const { data: events, error } = await supabase
                .from('slider_events')
                .select('participant_id, value, timestamp, session_ms')
                .eq('session_id', sessionId)
                .order('timestamp', { ascending: true });

            if (error) {
                console.error('[SliderData] Error exporting:', error);
                return NextResponse.json(
                    { error: 'Failed to export slider data' },
                    { status: 500 }
                );
            }

            // Get unique participants
            const participants = [...new Set(events?.map(e => e.participant_id) || [])];

            // Calculate aggregates per second
            const aggregates: { sessionMs: number; mean: number; min: number; max: number; count: number }[] = [];
            if (events && events.length > 0) {
                // Group by second
                const bySecond = new Map<number, number[]>();
                events.forEach(e => {
                    const second = Math.floor(e.session_ms / 1000) * 1000;
                    if (!bySecond.has(second)) bySecond.set(second, []);
                    bySecond.get(second)!.push(e.value);
                });

                bySecond.forEach((values, sessionMs) => {
                    aggregates.push({
                        sessionMs,
                        mean: values.reduce((a, b) => a + b, 0) / values.length,
                        min: Math.min(...values),
                        max: Math.max(...values),
                        count: values.length,
                    });
                });

                aggregates.sort((a, b) => a.sessionMs - b.sessionMs);
            }

            return NextResponse.json({
                sessionId,
                startTime: session?.recording_start_time,
                endTime: session?.recording_end_time,
                durationMs: session?.recording_end_time && session?.recording_start_time
                    ? session.recording_end_time - session.recording_start_time
                    : null,
                eventCount: events?.length || 0,
                participants,
                events: events?.map(e => ({
                    participantId: e.participant_id,
                    value: e.value,
                    timestamp: e.timestamp,
                    sessionMs: e.session_ms,
                })) || [],
                aggregates,
            });

        } else if (action === 'stop') {
            // Mark session as ended
            const endTime = Date.now();

            const { error } = await supabase
                .from('sessions')
                .update({ recording_end_time: endTime })
                .eq('id', sessionId);

            if (error) {
                console.error('[SliderData] Error stopping session:', error);
            }

            // Get event count
            const { count } = await supabase
                .from('slider_events')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId);

            console.log(`[SliderData] Stopped session ${sessionId} with ${count} events`);

            return NextResponse.json({
                success: true,
                sessionId,
                endTime,
                eventCount: count || 0,
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

// GET endpoint for easy export
export async function GET(request: NextRequest) {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json(
            { error: 'sessionId query param is required' },
            { status: 400 }
        );
    }

    // Reuse POST logic with action=export
    const fakeRequest = {
        json: async () => ({ action: 'export', sessionId }),
    } as NextRequest;

    return POST(fakeRequest);
}
