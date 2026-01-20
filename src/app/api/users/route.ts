// API Route: Users - User management
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';


export interface User {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'editor' | 'viewer';
    is_active: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, any>;
}

// GET /api/users - List all users
export async function GET(request: NextRequest) {
    try {
        const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
        const role = request.nextUrl.searchParams.get('role');
        const search = request.nextUrl.searchParams.get('search');

        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (role) {
            query = query.eq('role', role);
        }

        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        const { data: users, count, error } = await query;

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ users: [], total: 0 });
            }
            throw error;
        }

        return NextResponse.json({
            users: users || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/users - Create new user (invite)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, full_name, role = 'viewer' } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'email is required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser } = await getSupabaseServer()
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Validate role
        if (!['admin', 'editor', 'viewer'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be admin, editor, or viewer' },
                { status: 400 }
            );
        }

        const { data: user, error } = await getSupabaseServer()
            .from('users')
            .insert({
                email: email.toLowerCase(),
                full_name,
                role,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json(
                    { error: 'Users table not set up. Please run migrations.' },
                    { status: 500 }
                );
            }
            throw error;
        }

        return NextResponse.json({ user }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
