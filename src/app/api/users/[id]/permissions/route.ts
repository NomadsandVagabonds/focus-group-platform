// API Route: User Permissions - Manage user access to surveys
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


interface RouteParams {
    params: Promise<{ id: string }>;
}

export type PermissionLevel = 'view' | 'edit' | 'admin';

export interface UserPermission {
    id: string;
    user_id: string;
    survey_id: string;
    permission_level: PermissionLevel;
    granted_by?: string;
    created_at: string;
}

// GET /api/users/[id]/permissions - Get user's survey permissions
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { data: permissions, error } = await getSupabaseServer()
            .from('user_permissions')
            .select('*, surveys(id, title, status)')
            .eq('user_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ permissions: [] });
            }
            throw error;
        }

        return NextResponse.json({ permissions: permissions || [] });
    } catch (error: any) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/users/[id]/permissions - Grant permission to survey
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: userId } = await params;
        const body = await request.json();
        const { survey_id, permission_level, granted_by } = body;

        if (!survey_id) {
            return NextResponse.json(
                { error: 'survey_id is required' },
                { status: 400 }
            );
        }

        if (!['view', 'edit', 'admin'].includes(permission_level)) {
            return NextResponse.json(
                { error: 'Invalid permission level. Must be view, edit, or admin' },
                { status: 400 }
            );
        }

        // Check if permission already exists
        const { data: existingPermission } = await getSupabaseServer()
            .from('user_permissions')
            .select('id')
            .eq('user_id', userId)
            .eq('survey_id', survey_id)
            .single();

        if (existingPermission) {
            // Update existing permission
            const { data: permission, error } = await getSupabaseServer()
                .from('user_permissions')
                .update({
                    permission_level,
                    granted_by,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingPermission.id)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ permission });
        }

        // Create new permission
        const { data: permission, error } = await getSupabaseServer()
            .from('user_permissions')
            .insert({
                user_id: userId,
                survey_id,
                permission_level,
                granted_by,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json(
                    { error: 'Permissions table not set up. Please run migrations.' },
                    { status: 500 }
                );
            }
            throw error;
        }

        return NextResponse.json({ permission }, { status: 201 });
    } catch (error: any) {
        console.error('Error granting permission:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/users/[id]/permissions - Revoke permission
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: userId } = await params;
        const body = await request.json();
        const { survey_id, permission_id } = body;

        let query = supabase
            .from('user_permissions')
            .delete()
            .eq('user_id', userId);

        if (permission_id) {
            query = query.eq('id', permission_id);
        } else if (survey_id) {
            query = query.eq('survey_id', survey_id);
        } else {
            return NextResponse.json(
                { error: 'survey_id or permission_id is required' },
                { status: 400 }
            );
        }

        const { error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error revoking permission:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
