import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * GET /api/recordings?sessionId=xxx
 * List recordings for a session and return pre-signed URLs
 */
export async function GET(request: NextRequest) {
    try {
        const sessionId = request.nextUrl.searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            );
        }

        if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY || !AWS_S3_BUCKET) {
            return NextResponse.json(
                { error: 'S3 not configured' },
                { status: 500 }
            );
        }

        const s3Client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY,
                secretAccessKey: AWS_SECRET_KEY,
            },
        });

        // List objects in the session folder
        const prefix = `resonant/${sessionId}/`;
        const listCommand = new ListObjectsV2Command({
            Bucket: AWS_S3_BUCKET,
            Prefix: prefix,
        });

        const listResponse = await s3Client.send(listCommand);
        const objects = listResponse.Contents || [];

        // Filter for video files
        const recordings = await Promise.all(
            objects
                .filter(obj => obj.Key?.endsWith('.mp4'))
                .map(async (obj) => {
                    // Generate pre-signed URL (valid for 1 hour)
                    const getCommand = new GetObjectCommand({
                        Bucket: AWS_S3_BUCKET,
                        Key: obj.Key!,
                    });
                    const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

                    return {
                        key: obj.Key,
                        filename: obj.Key?.split('/').pop(),
                        size: obj.Size,
                        lastModified: obj.LastModified,
                        url: presignedUrl,
                    };
                })
        );

        return NextResponse.json({
            sessionId,
            bucket: AWS_S3_BUCKET,
            prefix,
            recordings,
            // Return the most recent recording URL for convenience
            latestUrl: recordings.length > 0
                ? recordings.sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0))[0].url
                : null,
        });

    } catch (error) {
        console.error('[Recordings] Error:', error);
        return NextResponse.json(
            { error: 'Failed to list recordings' },
            { status: 500 }
        );
    }
}
