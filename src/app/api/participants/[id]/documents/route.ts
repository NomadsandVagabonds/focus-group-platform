import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/participants/[id]/documents
 * List documents for a participant
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // List files in the participant's folder
        const { data: files, error } = await supabase.storage
            .from('participant-documents')
            .list(`${id}/`, {
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) throw error;

        // Generate public URLs for each file
        const documents = (files || []).map(file => {
            const { data: urlData } = supabase.storage
                .from('participant-documents')
                .getPublicUrl(`${id}/${file.name}`);

            return {
                name: file.name,
                size: file.metadata?.size || 0,
                createdAt: file.created_at,
                url: urlData.publicUrl
            };
        });

        return NextResponse.json({ documents });

    } catch (error) {
        console.error('Error listing documents:', error);
        return NextResponse.json(
            { error: 'Failed to list documents', documents: [] },
            { status: 200 }
        );
    }
}

/**
 * POST /api/participants/[id]/documents
 * Upload a document for a participant
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from('participant-documents')
            .upload(`${id}/${fileName}`, file, {
                contentType: file.type,
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('participant-documents')
            .getPublicUrl(data.path);

        return NextResponse.json({
            document: {
                name: fileName,
                path: data.path,
                url: urlData.publicUrl
            }
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        return NextResponse.json(
            { error: 'Failed to upload document' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/participants/[id]/documents
 * Delete a document
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { fileName } = await request.json();

        if (!fileName) {
            return NextResponse.json(
                { error: 'No file name provided' },
                { status: 400 }
            );
        }

        const { error } = await supabase.storage
            .from('participant-documents')
            .remove([`${id}/${fileName}`]);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { error: 'Failed to delete document' },
            { status: 500 }
        );
    }
}
