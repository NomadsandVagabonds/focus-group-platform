import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_SHARE_TOKEN = process.env.ADMIN_SHARE_TOKEN || '';

/**
 * POST /api/admin-auth
 * Verify admin password (or share token) and set auth cookie
 */
export async function POST(request: NextRequest) {
    try {
        const { password, token } = await request.json();

        // Check for share token (for shareable links)
        if (token && ADMIN_SHARE_TOKEN && token === ADMIN_SHARE_TOKEN) {
            const response = NextResponse.json({ success: true });
            response.cookies.set('admin_auth', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days for token access
                path: '/',
            });
            return response;
        }

        // Regular password auth
        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            );
        }

        if (!ADMIN_PASSWORD) {
            console.error('[Admin Auth] ADMIN_PASSWORD environment variable not set');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        if (password !== ADMIN_PASSWORD) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            );
        }

        // Create response with success
        const response = NextResponse.json({ success: true });

        // Set httpOnly cookie that expires in 24 hours
        response.cookies.set('admin_auth', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('[Admin Auth] Error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin-auth
 * Check if user is authenticated (has valid cookie)
 */
export async function GET(request: NextRequest) {
    const authCookie = request.cookies.get('admin_auth');

    if (authCookie?.value === 'authenticated') {
        return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
}

/**
 * DELETE /api/admin-auth
 * Logout - clear the auth cookie
 */
export async function DELETE() {
    const response = NextResponse.json({ success: true });

    response.cookies.set('admin_auth', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
        path: '/',
    });

    return response;
}

