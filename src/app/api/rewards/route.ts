import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recalculateProbabilities } from '@/lib/rewards';
import { requireAdmin } from '@/lib/auth';
import { sanitizeString } from '@/lib/validation';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    if (!event_id) {
        return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    try {
        const rewards = await prisma.reward.findMany({
            where: { event_id },
            orderBy: {
                created_at: 'desc',
            },
        });
        return NextResponse.json(rewards);
    } catch (error) {
        console.error('Failed to fetch rewards:', error);
        return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { name, description, value, count, is_lose, event_id } = body;

        if (!name || value === undefined || count === undefined || !event_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const sanitizedName = sanitizeString(name);
        const sanitizedDescription = description ? sanitizeString(description, 1000) : description;

        const result = await prisma.$transaction(async (tx) => {
            const reward = await tx.reward.create({
                data: {
                    event_id,
                    name: sanitizedName,
                    description: sanitizedDescription,
                    value: Number(value),
                    count: Number(count),
                    is_lose: Boolean(is_lose),
                    probability: 0,
                },
            });

            await recalculateProbabilities(tx, event_id);

            return await tx.reward.findUnique({
                where: { id: reward.id },
            });
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Failed to create reward:', error);
        return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
    }
}
