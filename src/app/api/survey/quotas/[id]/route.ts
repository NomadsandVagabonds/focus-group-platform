// API Route: Single Quota Operations
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


// GET /api/survey/quotas/[id] - Get single quota
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: quota, error } = await getSupabaseServer()
            .from('survey_quotas')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !quota) {
            return NextResponse.json({ error: 'Quota not found' }, { status: 404 });
        }

        return NextResponse.json({ quota });
    } catch (error: any) {
        console.error('Error fetching quota:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/survey/quotas/[id] - Update quota
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { data: quota, error } = await getSupabaseServer()
            .from('survey_quotas')
            .update({
                name: body.name,
                description: body.description,
                limit: body.limit,
                action: body.action,
                redirect_url: body.redirectUrl,
                conditions: body.conditions,
                is_active: body.isActive,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ quota });
    } catch (error: any) {
        console.error('Error updating quota:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/survey/quotas/[id] - Delete quota
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await getSupabaseServer()
            .from('survey_quotas')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting quota:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/survey/quotas/[id] - Increment quota count
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action } = body; // 'increment' or 'reset'

        if (action === 'increment') {
            const { data, error } = await getSupabaseServer().rpc('increment_quota_count', {
                quota_id: id
            });

            if (error) {
                // If the function doesn't exist, do it manually
                const { data: quota } = await getSupabaseServer()
                    .from('survey_quotas')
                    .select('current_count')
                    .eq('id', id)
                    .single();

                if (quota) {
                    await getSupabaseServer()
                        .from('survey_quotas')
                        .update({ current_count: quota.current_count + 1 })
                        .eq('id', id);
                }
            }
        } else if (action === 'reset') {
            await getSupabaseServer()
                .from('survey_quotas')
                .update({ current_count: 0 })
                .eq('id', id);
        }

        // Fetch updated quota
        const { data: quota } = await getSupabaseServer()
            .from('survey_quotas')
            .select('*')
            .eq('id', id)
            .single();

        return NextResponse.json({ quota });
    } catch (error: any) {
        console.error('Error updating quota count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
