import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    try {
        const body = await request.json();
        const { title, slug, description } = body;

        const event = await (prisma as any).event.create({
            data: {
                title,
                slug,
                description,
                is_active: true
            },
        });
        return NextResponse.json(event);
    } catch (error) {
        console.error("API: Create event error:", error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
