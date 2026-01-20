// API Route: Survey Resume - Save and resume incomplete responses
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';


interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/survey/[id]/resume - Create or update resume token for a response
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: surveyId } = await params;
        const body = await request.json();
        const { response_id, email } = body;

        if (!response_id) {
            return NextResponse.json(
                { error: 'response_id is required' },
                { status: 400 }
            );
        }

        // Verify the response exists and belongs to this survey
        const { data: response, error: responseError } = await getSupabaseServer()
            .from('survey_responses')
            .select('id, survey_id, status')
            .eq('id', response_id)
            .eq('survey_id', surveyId)
            .single();

        if (responseError || !response) {
            return NextResponse.json(
                { error: 'Response not found' },
                { status: 404 }
            );
        }

        if (response.status === 'complete') {
            return NextResponse.json(
                { error: 'Cannot create resume token for completed response' },
                { status: 400 }
            );
        }

        // Get survey settings for expiry
        const { data: survey } = await getSupabaseServer()
            .from('surveys')
            .select('settings')
            .eq('id', surveyId)
            .single();

        const expiryDays = survey?.settings?.resume_token_expiry_days || 7;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        // Generate resume token
        const resumeToken = generateResumeToken();

        // Check for existing resume token
        const { data: existingToken } = await getSupabaseServer()
            .from('resume_tokens')
            .select('id')
            .eq('response_id', response_id)
            .single();

        let tokenData;
        if (existingToken) {
            // Update existing token
            const { data, error } = await getSupabaseServer()
                .from('resume_tokens')
                .update({
                    token: resumeToken,
                    email,
                    expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingToken.id)
                .select()
                .single();

            if (error) throw error;
            tokenData = data;
        } else {
            // Create new token
            const { data, error } = await getSupabaseServer()
                .from('resume_tokens')
                .insert({
                    survey_id: surveyId,
                    response_id,
                    token: resumeToken,
                    email,
                    expires_at: expiresAt.toISOString(),
                })
                .select()
                .single();

            if (error) {
                if (error.code === '42P01') {
                    return NextResponse.json(
                        { error: 'Resume tokens table not set up. Please run migrations.' },
                        { status: 500 }
                    );
                }
                throw error;
            }
            tokenData = data;
        }

        // Generate resume URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resumeUrl = `${baseUrl}/survey/${surveyId}/resume?token=${resumeToken}`;

        return NextResponse.json({
            token: resumeToken,
            resume_url: resumeUrl,
            expires_at: tokenData.expires_at,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating resume token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/survey/[id]/resume?token=xxx - Validate resume token and get response data
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: surveyId } = await params;
        const token = request.nextUrl.searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'token is required' },
                { status: 400 }
            );
        }

        // Look up the resume token
        const { data: resumeToken, error: tokenError } = await getSupabaseServer()
            .from('resume_tokens')
            .select('*, survey_responses(*)')
            .eq('token', token)
            .eq('survey_id', surveyId)
            .single();

        if (tokenError || !resumeToken) {
            return NextResponse.json(
                { valid: false, error: 'Invalid or expired resume token' },
                { status: 404 }
            );
        }

        // Check expiration
        if (new Date(resumeToken.expires_at) < new Date()) {
            return NextResponse.json(
                { valid: false, error: 'Resume token has expired' },
                { status: 410 }
            );
        }

        // Check if response is still incomplete
        if (resumeToken.survey_responses?.status === 'complete') {
            return NextResponse.json(
                { valid: false, error: 'This survey has already been completed' },
                { status: 400 }
            );
        }

        // Get response data
        const { data: responseData, error: dataError } = await getSupabaseServer()
            .from('response_data')
            .select('question_id, subquestion_id, value')
            .eq('response_id', resumeToken.response_id);

        if (dataError) throw dataError;

        // Update last accessed
        await getSupabaseServer()
            .from('resume_tokens')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', resumeToken.id);

        return NextResponse.json({
            valid: true,
            response_id: resumeToken.response_id,
            response: resumeToken.survey_responses,
            response_data: responseData || [],
            expires_at: resumeToken.expires_at,
        });
    } catch (error: any) {
        console.error('Error validating resume token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/survey/[id]/resume - Invalidate resume token (on completion)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: surveyId } = await params;
        const body = await request.json();
        const { response_id, token } = body;

        let query = supabase
            .from('resume_tokens')
            .delete()
            .eq('survey_id', surveyId);

        if (response_id) {
            query = query.eq('response_id', response_id);
        } else if (token) {
            query = query.eq('token', token);
        } else {
            return NextResponse.json(
                { error: 'response_id or token is required' },
                { status: 400 }
            );
        }

        const { error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting resume token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Generate a secure resume token
function generateResumeToken(): string {
    return randomBytes(24).toString('base64url');
}
