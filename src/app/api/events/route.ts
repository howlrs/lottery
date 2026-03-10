import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sanitizeString } from '@/lib/validation';

export async function GET() {
    console.log('API: GET /api/events');
    try {
        const events = await (prisma as any).event.findMany({
            orderBy: { created_at: 'desc' },
        });
        return NextResponse.json(events);
    } catch (error) {
        console.error('API: Failed to fetch events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { title, slug, description } = body;

        // Validate slug format (alphanumeric + hyphens only)
        if (!slug || !/^[a-zA-Z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: 'Invalid slug format. Use only alphanumeric characters and hyphens.' }, { status: 400 });
        }

        const sanitizedTitle = sanitizeString(title);
        const sanitizedDescription = description ? sanitizeString(description, 1000) : description;

        const event = await (prisma as any).event.create({
            data: {
                title: sanitizedTitle,
                slug: slug.trim(),
                description: sanitizedDescription,
                is_active: true
            },
        });
        return NextResponse.json(event);
    } catch (error) {
        console.error("API: Create event error:", error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
