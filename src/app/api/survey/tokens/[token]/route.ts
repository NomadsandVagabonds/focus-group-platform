// API Route: Token Validation - Validate and use survey access tokens
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


interface RouteParams {
    params: Promise<{ token: string }>;
}

// GET /api/survey/tokens/[token] - Validate a token
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;

        const { data: tokenData, error } = await getSupabaseServer()
            .from('survey_tokens')
            .select('*, surveys(id, title, status)')
            .eq('token', token.toUpperCase())
            .single();

        if (error || !tokenData) {
            return NextResponse.json(
                { valid: false, error: 'Invalid token' },
                { status: 404 }
            );
        }

        // Check if token is expired
        if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
            return NextResponse.json(
                { valid: false, error: 'Token has expired' },
                { status: 410 }
            );
        }

        // Check if token has remaining uses
        if (tokenData.uses_remaining <= 0) {
            return NextResponse.json(
                { valid: false, error: 'Token has been fully used' },
                { status: 410 }
            );
        }

        // Check if survey is active
        if (tokenData.surveys?.status !== 'active') {
            return NextResponse.json(
                { valid: false, error: 'Survey is not currently active' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            valid: true,
            token: {
                id: tokenData.id,
                survey_id: tokenData.survey_id,
                email: tokenData.email,
                name: tokenData.name,
                uses_remaining: tokenData.uses_remaining,
                expires_at: tokenData.expires_at,
                metadata: tokenData.metadata,
            },
            survey: tokenData.surveys,
        });
    } catch (error: any) {
        console.error('Error validating token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/survey/tokens/[token] - Use a token (decrement uses)
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;
        const body = await request.json();
        const { response_id } = body;

        // First validate the token
        const { data: tokenData, error: fetchError } = await getSupabaseServer()
            .from('survey_tokens')
            .select('*')
            .eq('token', token.toUpperCase())
            .single();

        if (fetchError || !tokenData) {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 404 }
            );
        }

        // Check if token is expired
        if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Token has expired' },
                { status: 410 }
            );
        }

        // Check if token has remaining uses
        if (tokenData.uses_remaining <= 0) {
            return NextResponse.json(
                { success: false, error: 'Token has no remaining uses' },
                { status: 410 }
            );
        }

        // Decrement uses and update status
        const newUsesRemaining = tokenData.uses_remaining - 1;
        const newStatus = newUsesRemaining <= 0 ? 'used' : tokenData.status;

        const { data: updatedToken, error: updateError } = await getSupabaseServer()
            .from('survey_tokens')
            .update({
                uses_remaining: newUsesRemaining,
                status: newStatus,
                used_at: new Date().toISOString(),
                metadata: {
                    ...tokenData.metadata,
                    last_response_id: response_id,
                    last_used_at: new Date().toISOString(),
                },
            })
            .eq('id', tokenData.id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            token: updatedToken,
            uses_remaining: newUsesRemaining,
        });
    } catch (error: any) {
        console.error('Error using token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/survey/tokens/[token] - Update token metadata or extend expiration
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;
        const body = await request.json();
        const { extends_days, add_uses, metadata } = body;

        const { data: tokenData, error: fetchError } = await getSupabaseServer()
            .from('survey_tokens')
            .select('*')
            .eq('token', token.toUpperCase())
            .single();

        if (fetchError || !tokenData) {
            return NextResponse.json(
                { error: 'Token not found' },
                { status: 404 }
            );
        }

        const updates: Record<string, any> = {};

        if (extends_days) {
            const currentExpiry = tokenData.expires_at
                ? new Date(tokenData.expires_at)
                : new Date();
            currentExpiry.setDate(currentExpiry.getDate() + extends_days);
            updates.expires_at = currentExpiry.toISOString();
        }

        if (add_uses) {
            updates.uses_remaining = tokenData.uses_remaining + add_uses;
            if (updates.uses_remaining > 0 && tokenData.status === 'used') {
                updates.status = 'unused';
            }
        }

        if (metadata) {
            updates.metadata = { ...tokenData.metadata, ...metadata };
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid updates provided' },
                { status: 400 }
            );
        }

        const { data: updatedToken, error: updateError } = await getSupabaseServer()
            .from('survey_tokens')
            .update(updates)
            .eq('id', tokenData.id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ token: updatedToken });
    } catch (error: any) {
        console.error('Error updating token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
