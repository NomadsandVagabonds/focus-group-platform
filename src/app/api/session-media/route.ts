import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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

/**
 * GET /api/session-media?sessionId=xxx
 * List all media for a session
 */
export async function GET(request: NextRequest) {
    try {
        const sessionId = request.nextUrl.searchParams.get('sessionId');
        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        // Get from database
        const { data: media, error } = await supabase
            .from('session_media')
            .select('*')
            .eq('session_id', sessionId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('[SessionMedia] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
        }

        // Generate pre-signed URLs for each item
        const s3Client = getS3Client();
        const mediaWithUrls = await Promise.all(
            (media || []).map(async (item) => {
                const getCommand = new GetObjectCommand({
                    Bucket: AWS_S3_BUCKET,
                    Key: item.s3_key,
                });
                const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
                return { ...item, url };
            })
        );

        return NextResponse.json({ media: mediaWithUrls });
    } catch (error) {
        console.error('[SessionMedia] Error:', error);
        return NextResponse.json({ error: 'Failed to list media' }, { status: 500 });
    }
}

/**
 * POST /api/session-media
 * Upload new media file
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const sessionId = formData.get('sessionId') as string;
        const file = formData.get('file') as File;

        if (!sessionId || !file) {
            return NextResponse.json({ error: 'sessionId and file required' }, { status: 400 });
        }

        // Upload to S3
        const s3Key = `resonant/${sessionId}/media/${Date.now()}-${file.name}`;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const s3Client = getS3Client();
        await s3Client.send(new PutObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: s3Key,
            Body: buffer,
            ContentType: file.type,
        }));

        // Get current max order
        const { data: existing } = await supabase
            .from('session_media')
            .select('display_order')
            .eq('session_id', sessionId)
            .order('display_order', { ascending: false })
            .limit(1);

        const nextOrder = (existing?.[0]?.display_order || 0) + 1;

        // Insert into database
        const { data: newMedia, error } = await supabase
            .from('session_media')
            .insert({
                session_id: sessionId,
                filename: file.name,
                s3_key: s3Key,
                file_type: getFileType(file.name),
                display_order: nextOrder,
            })
            .select()
            .single();

        if (error) {
            console.error('[SessionMedia] DB insert error:', error);
            return NextResponse.json({ error: 'Failed to save media' }, { status: 500 });
        }

        // Generate signed URL
        const url = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: s3Key,
        }), { expiresIn: 3600 });

        return NextResponse.json({ media: { ...newMedia, url } });
    } catch (error) {
        console.error('[SessionMedia] Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

/**
 * PUT /api/session-media
 * Update media order
 */
export async function PUT(request: NextRequest) {
    try {
        const { mediaId, displayOrder } = await request.json();

        const { error } = await supabase
            .from('session_media')
            .update({ display_order: displayOrder })
            .eq('id', mediaId);

        if (error) {
            return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[SessionMedia] Update error:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

/**
 * DELETE /api/session-media?id=xxx
 * Remove media item
 */
export async function DELETE(request: NextRequest) {
    try {
        const mediaId = request.nextUrl.searchParams.get('id');
        if (!mediaId) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        // Get the item first
        const { data: item } = await supabase
            .from('session_media')
            .select('s3_key')
            .eq('id', mediaId)
            .single();

        if (item?.s3_key) {
            // Delete from S3
            const s3Client = getS3Client();
            await s3Client.send(new DeleteObjectCommand({
                Bucket: AWS_S3_BUCKET,
                Key: item.s3_key,
            }));
        }

        // Delete from database
        await supabase
            .from('session_media')
            .delete()
            .eq('id', mediaId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[SessionMedia] Delete error:', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
