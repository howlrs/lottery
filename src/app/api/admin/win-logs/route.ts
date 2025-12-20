import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const event_id = searchParams.get('event_id');

        if (!event_id) {
            return NextResponse.json({ error: 'Missing event_id' }, { status: 400 });
        }

        const winLogs = await prisma.winLog.findMany({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            where: {
                reward: {
                    event_id: event_id,
                    is_lose: false
                }
            } as any,
            include: {
                reward: true
            },
            orderBy: {
                won_at: 'desc'
            } as any
        });

        return NextResponse.json(winLogs);
    } catch (error: unknown) {
        console.error('Failed to fetch win logs:', error);
        return NextResponse.json({ error: 'Failed to fetch win logs' }, { status: 500 });
    }
}
