// API Route: Survey Permissions - Manage who can access a survey
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/survey/[id]/permissions - Get all users with access to survey
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: surveyId } = await params;

        const { data: permissions, error } = await getSupabaseServer()
            .from('user_permissions')
            .select('*, users(id, email, full_name, role)')
            .eq('survey_id', surveyId)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ permissions: [] });
            }
            throw error;
        }

        return NextResponse.json({ permissions: permissions || [] });
    } catch (error: any) {
        console.error('Error fetching survey permissions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/survey/[id]/permissions - Add users to survey
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: surveyId } = await params;
        const body = await request.json();
        const { users, permission_level, granted_by } = body;

        if (!users || !Array.isArray(users) || users.length === 0) {
            return NextResponse.json(
                { error: 'users array is required' },
                { status: 400 }
            );
        }

        if (!['view', 'edit', 'admin'].includes(permission_level)) {
            return NextResponse.json(
                { error: 'Invalid permission level. Must be view, edit, or admin' },
                { status: 400 }
            );
        }

        const permissionsToCreate = users.map(userId => ({
            user_id: userId,
            survey_id: surveyId,
            permission_level,
            granted_by,
        }));

        const { data: permissions, error } = await getSupabaseServer()
            .from('user_permissions')
            .upsert(permissionsToCreate, {
                onConflict: 'user_id,survey_id',
                ignoreDuplicates: false,
            })
            .select();

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json(
                    { error: 'Permissions table not set up. Please run migrations.' },
                    { status: 500 }
                );
            }
            throw error;
        }

        return NextResponse.json({ permissions }, { status: 201 });
    } catch (error: any) {
        console.error('Error adding survey permissions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/survey/[id]/permissions - Remove users from survey
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: surveyId } = await params;
        const body = await request.json();
        const { user_ids } = body;

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return NextResponse.json(
                { error: 'user_ids array is required' },
                { status: 400 }
            );
        }

        const { error } = await getSupabaseServer()
            .from('user_permissions')
            .delete()
            .eq('survey_id', surveyId)
            .in('user_id', user_ids);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error removing survey permissions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
