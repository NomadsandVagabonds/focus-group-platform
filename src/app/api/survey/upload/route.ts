// API Route: File Upload for Survey Responses
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


// Maximum file size in bytes (default 10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file extensions (can be overridden per question)
const DEFAULT_ALLOWED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'csv', 'rtf', 'odt', 'ods', 'odp',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
    'mp3', 'wav', 'ogg', 'mp4', 'avi', 'mov', 'webm',
    'zip', 'rar', '7z', 'tar', 'gz'
];

// POST - Upload a file
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const responseId = formData.get('response_id') as string | null;
        const questionId = formData.get('question_id') as string | null;
        const allowedTypes = formData.get('allowed_types') as string | null;
        const maxSize = formData.get('max_size') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!responseId || !questionId) {
            return NextResponse.json({ error: 'Missing response_id or question_id' }, { status: 400 });
        }

        // Validate file size
        const maxSizeBytes = maxSize ? parseInt(maxSize) * 1024 * 1024 : MAX_FILE_SIZE;
        if (file.size > maxSizeBytes) {
            return NextResponse.json({
                error: `File size exceeds maximum of ${maxSize || 10} MB`
            }, { status: 400 });
        }

        // Validate file extension
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        const allowedExtensions = allowedTypes
            ? allowedTypes.split(',').map(t => t.trim().toLowerCase())
            : DEFAULT_ALLOWED_EXTENSIONS;

        if (!allowedExtensions.includes(extension)) {
            return NextResponse.json({
                error: `File type .${extension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`
            }, { status: 400 });
        }

        // Generate unique file path
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `surveys/${responseId}/${questionId}/${timestamp}_${randomSuffix}_${safeFileName}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await getSupabaseServer().storage
            .from('survey-uploads')
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);

            // If bucket doesn't exist, try to create it
            if (uploadError.message?.includes('Bucket not found')) {
                // Create the bucket
                const { error: createBucketError } = await getSupabaseServer().storage.createBucket('survey-uploads', {
                    public: false,
                    allowedMimeTypes: [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'text/plain',
                        'text/csv',
                        'image/*',
                        'audio/*',
                        'video/*',
                        'application/zip',
                        'application/x-rar-compressed',
                        'application/x-7z-compressed'
                    ],
                    fileSizeLimit: MAX_FILE_SIZE
                });

                if (createBucketError) {
                    console.error('Error creating bucket:', createBucketError);
                    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
                }

                // Retry upload
                const { data: retryData, error: retryError } = await getSupabaseServer().storage
                    .from('survey-uploads')
                    .upload(filePath, buffer, {
                        contentType: file.type,
                        cacheControl: '3600',
                        upsert: false
                    });

                if (retryError) {
                    return NextResponse.json({ error: retryError.message }, { status: 500 });
                }
            } else {
                return NextResponse.json({ error: uploadError.message }, { status: 500 });
            }
        }

        // Get public URL (or signed URL for private files)
        const { data: urlData } = getSupabaseServer().storage
            .from('survey-uploads')
            .getPublicUrl(filePath);

        // Store file metadata in database
        const { data: fileRecord, error: dbError } = await supabase
            .from('uploaded_files')
            .insert({
                response_id: responseId,
                question_id: questionId,
                file_name: file.name,
                file_path: filePath,
                file_size: file.size,
                file_type: file.type,
                url: urlData.publicUrl
            })
            .select()
            .single();

        if (dbError) {
            // If table doesn't exist, still return success with URL
            console.error('Database error (table may not exist):', dbError);
            return NextResponse.json({
                success: true,
                file: {
                    id: `temp_${timestamp}_${randomSuffix}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    path: filePath,
                    url: urlData.publicUrl
                }
            });
        }

        return NextResponse.json({
            success: true,
            file: {
                id: fileRecord.id,
                name: fileRecord.file_name,
                size: fileRecord.file_size,
                type: fileRecord.file_type,
                path: fileRecord.file_path,
                url: fileRecord.url
            }
        });
    } catch (error: any) {
        console.error('File upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Remove an uploaded file
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('path');
        const fileId = searchParams.get('id');

        if (!filePath) {
            return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
        }

        // Delete from storage
        const { error: storageError } = await getSupabaseServer().storage
            .from('survey-uploads')
            .remove([filePath]);

        if (storageError) {
            console.error('Storage delete error:', storageError);
        }

        // Delete from database if ID provided
        if (fileId) {
            const { error: dbError } = await supabase
                .from('uploaded_files')
                .delete()
                .eq('id', fileId);

            if (dbError) {
                console.error('Database delete error:', dbError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('File delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET - List files for a response/question
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const responseId = searchParams.get('response_id');
        const questionId = searchParams.get('question_id');

        if (!responseId) {
            return NextResponse.json({ error: 'Missing response_id' }, { status: 400 });
        }

        let query = supabase
            .from('uploaded_files')
            .select('*')
            .eq('response_id', responseId);

        if (questionId) {
            query = query.eq('question_id', questionId);
        }

        const { data: files, error } = await query;

        if (error) {
            // Table might not exist yet
            return NextResponse.json({ files: [] });
        }

        return NextResponse.json({ files });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
