import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow access to login page and auth API
    if (pathname === '/admin/login' || pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
    }

    // Protect /admin routes
    if (pathname.startsWith('/admin')) {
        const session = request.cookies.get('admin-session')?.value;
        if (!session) {
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Verify session token inline (can't import from route handler in middleware)
        try {
            const decoded = Buffer.from(session, 'base64').toString('utf-8');
            const parts = decoded.split(':');
            if (parts.length !== 3) {
                const loginUrl = new URL('/admin/login', request.url);
                return NextResponse.redirect(loginUrl);
            }

            const [, timestamp] = parts;
            const age = (Date.now() - Number(timestamp)) / 1000;
            const maxAge = 60 * 60 * 24; // 24 hours
            if (age > maxAge) {
                const loginUrl = new URL('/admin/login', request.url);
                const response = NextResponse.redirect(loginUrl);
                response.cookies.set('admin-session', '', { path: '/', maxAge: 0 });
                return response;
            }
        } catch {
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
