// API Route: Survey Tokens - Generate and manage access tokens
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';


export interface SurveyToken {
    id: string;
    survey_id: string;
    token: string;
    email?: string;
    name?: string;
    status: 'unused' | 'used' | 'expired';
    uses_remaining: number;
    expires_at?: string;
    metadata?: Record<string, any>;
    created_at: string;
    used_at?: string;
}

// GET /api/survey/tokens?surveyId=xxx - Get tokens for a survey
export async function GET(request: NextRequest) {
    try {
        const surveyId = request.nextUrl.searchParams.get('surveyId');
        const status = request.nextUrl.searchParams.get('status');
        const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

        if (!surveyId) {
            return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });
        }

        let query = getSupabaseServer()
            .from('survey_tokens')
            .select('*', { count: 'exact' })
            .eq('survey_id', surveyId)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: tokens, count, error } = await query;

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ tokens: [], total: 0 });
            }
            throw error;
        }

        return NextResponse.json({
            tokens: tokens || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error: any) {
        console.error('Error fetching tokens:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/survey/tokens - Generate new tokens
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            surveyId,
            count = 1,
            emails = [],
            tokenLength = 8,
            usesPerToken = 1,
            expiresIn = null, // Days until expiration
            metadata = {},
        } = body;

        if (!surveyId) {
            return NextResponse.json(
                { error: 'surveyId is required' },
                { status: 400 }
            );
        }

        const tokensToCreate: Partial<SurveyToken>[] = [];
        const expiresAt = expiresIn
            ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
            : undefined;

        // If emails provided, create one token per email
        if (emails.length > 0) {
            for (const emailEntry of emails) {
                const email = typeof emailEntry === 'string' ? emailEntry : emailEntry.email;
                const name = typeof emailEntry === 'object' ? emailEntry.name : undefined;

                tokensToCreate.push({
                    survey_id: surveyId,
                    token: generateToken(tokenLength),
                    email,
                    name,
                    status: 'unused',
                    uses_remaining: usesPerToken,
                    expires_at: expiresAt,
                    metadata,
                });
            }
        } else {
            // Create anonymous tokens
            for (let i = 0; i < count; i++) {
                tokensToCreate.push({
                    survey_id: surveyId,
                    token: generateToken(tokenLength),
                    status: 'unused',
                    uses_remaining: usesPerToken,
                    expires_at: expiresAt,
                    metadata,
                });
            }
        }

        const { data: tokens, error } = await getSupabaseServer()
            .from('survey_tokens')
            .insert(tokensToCreate)
            .select();

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json(
                    { error: 'Tokens table not set up. Please run migrations.' },
                    { status: 500 }
                );
            }
            throw error;
        }

        return NextResponse.json({ tokens, count: tokens.length }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating tokens:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/survey/tokens - Bulk delete tokens
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { surveyId, tokenIds, status } = body;

        if (!surveyId) {
            return NextResponse.json(
                { error: 'surveyId is required' },
                { status: 400 }
            );
        }

        let query = getSupabaseServer()
            .from('survey_tokens')
            .delete()
            .eq('survey_id', surveyId);

        if (tokenIds && tokenIds.length > 0) {
            query = query.in('id', tokenIds);
        } else if (status) {
            query = query.eq('status', status);
        } else {
            return NextResponse.json(
                { error: 'Either tokenIds or status is required' },
                { status: 400 }
            );
        }

        const { error, count } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, deleted: count });
    } catch (error: any) {
        console.error('Error deleting tokens:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Generate a secure random token
function generateToken(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, 1, I)
    const bytes = randomBytes(length);
    let token = '';

    for (let i = 0; i < length; i++) {
        token += chars[bytes[i] % chars.length];
    }

    return token;
}
