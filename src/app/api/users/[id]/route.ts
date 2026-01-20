// API Route: Single User - Get, update, delete user
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { data: user, error } = await getSupabaseServer()
            .from('users')
            .select('*, user_permissions(*)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { full_name, role, is_active, metadata } = body;

        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (full_name !== undefined) updates.full_name = full_name;
        if (role !== undefined) {
            if (!['admin', 'editor', 'viewer'].includes(role)) {
                return NextResponse.json(
                    { error: 'Invalid role. Must be admin, editor, or viewer' },
                    { status: 400 }
                );
            }
            updates.role = role;
        }
        if (is_active !== undefined) updates.is_active = is_active;
        if (metadata !== undefined) updates.metadata = metadata;

        const { data: user, error } = await getSupabaseServer()
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { error } = await getSupabaseServer()
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
