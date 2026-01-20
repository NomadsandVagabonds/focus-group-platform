import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

// Lazy-initialize OpenAI client (avoids build-time error)
function getOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
    try {
        const { sessionId, recordingUrl } = await request.json();

        if (!sessionId || !recordingUrl) {
            return NextResponse.json(
                { error: 'sessionId and recordingUrl are required' },
                { status: 400 }
            );
        }

        console.log('[Transcribe] Starting transcription for session:', sessionId);

        // Download the recording from S3
        const recordingResponse = await fetch(recordingUrl);
        if (!recordingResponse.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch recording from S3' },
                { status: 500 }
            );
        }

        // Convert to blob/file for OpenAI
        const audioBuffer = await recordingResponse.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        console.log('[Transcribe] Audio file size:', audioFile.size, 'bytes');

        // Check file size (Whisper limit is 25MB)
        if (audioFile.size > 25 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Audio file too large (max 25MB). Split or use chunked processing.' },
                { status: 400 }
            );
        }

        // Call OpenAI Whisper API with word-level timestamps
        const openai = getOpenAI();
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            response_format: 'verbose_json',
            timestamp_granularities: ['word', 'segment'],
        });

        console.log('[Transcribe] Complete, segments:', transcription.segments?.length);

        // Save to database
        const { data, error } = await supabase
            .from('session_transcripts')
            .upsert({
                session_id: sessionId,
                recording_url: recordingUrl,
                transcript_text: transcription.text,
                segments: transcription.segments,
                words: transcription.words,
                language: transcription.language,
                duration: transcription.duration,
            }, { onConflict: 'session_id' })
            .select()
            .single();

        if (error) {
            console.error('[Transcribe] DB error:', error);
            return NextResponse.json({
                success: true,
                dbSaved: false,
                transcription: {
                    text: transcription.text,
                    segments: transcription.segments,
                    words: transcription.words,
                    duration: transcription.duration,
                }
            });
        }

        return NextResponse.json({
            success: true,
            dbSaved: true,
            transcription: {
                id: data.id,
                text: transcription.text,
                segments: transcription.segments,
                words: transcription.words,
                duration: transcription.duration,
            }
        });

    } catch (error: unknown) {
        console.error('[Transcribe] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Transcription failed' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('session_transcripts')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Transcription not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, transcription: data });

    } catch (error: unknown) {
        console.error('[Transcribe] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch' },
            { status: 500 }
        );
    }
}
