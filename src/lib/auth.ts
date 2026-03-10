import { NextResponse } from 'next/server';

export function requireAdmin(request: Request): NextResponse | null {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) return null; // Dev mode: no auth required

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (token !== adminSecret) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null; // Auth passed
}
