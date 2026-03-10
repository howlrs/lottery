import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_USER = 'test-user';
const ADMIN_PASSWORD = 'password123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'lottery-sample-session-secret';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

function createSessionToken(): string {
    const payload = `${ADMIN_USER}:${Date.now()}`;
    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function verifySessionToken(token: string): boolean {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        if (parts.length !== 3) return false;

        const [user, timestamp, signature] = parts;
        if (user !== ADMIN_USER) return false;

        const age = (Date.now() - Number(timestamp)) / 1000;
        if (age > SESSION_MAX_AGE) return false;

        const hmac = crypto.createHmac('sha256', SESSION_SECRET);
        hmac.update(`${user}:${timestamp}`);
        const expected = hmac.digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { username, password } = body;

    if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin-session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
    });

    return response;
}
