import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabase';

const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

function getS3Client() {
    return new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY,
            secretAccessKey: AWS_SECRET_KEY,
        },
    });
}

function getFileType(filename: string): 'image' | 'video' | 'audio' | 'pdf' | 'other' {
    const ext = filename.toLowerCase().split('.').pop() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    return 'other';
}

function getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const types: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
        mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
        pdf: 'application/pdf'
    };
    return types[ext] || 'application/octet-stream';
}

/**
 * POST /api/session-media/upload-url
 * Get a pre-signed URL for direct S3 upload
 */
export async function POST(request: NextRequest) {
    try {
        const { sessionId, filename, contentType } = await request.json();

        if (!sessionId || !filename) {
            return NextResponse.json({ error: 'sessionId and filename required' }, { status: 400 });
        }

        const s3Key = `resonant/${sessionId}/media/${Date.now()}-${filename}`;
        const s3Client = getS3Client();

        // Generate pre-signed PUT URL
        const putCommand = new PutObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: s3Key,
            ContentType: contentType || getContentType(filename),
        });

        const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 600 }); // 10 min

        // Get current max order
        const { data: existing } = await getSupabaseServer()
            .from('session_media')
            .select('display_order')
            .eq('session_id', sessionId)
            .order('display_order', { ascending: false })
            .limit(1);

        const nextOrder = (existing?.[0]?.display_order || 0) + 1;

        // Pre-insert into database (will be orphaned if upload fails, but that's ok)
        const { data: newMedia, error } = await getSupabaseServer()
            .from('session_media')
            .insert({
                session_id: sessionId,
                filename: filename,
                s3_key: s3Key,
                file_type: getFileType(filename),
                display_order: nextOrder,
            })
            .select()
            .single();

        if (error) {
            console.error('[UploadUrl] DB insert error:', error);
            return NextResponse.json({ error: 'Failed to create media record' }, { status: 500 });
        }

        return NextResponse.json({
            uploadUrl,
            s3Key,
            mediaId: newMedia.id,
        });
    } catch (error) {
        console.error('[UploadUrl] Error:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
}
