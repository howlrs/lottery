import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recalculateProbabilities } from '@/lib/rewards';

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
    try {
        const body = await request.json();
        const { name, description, value, count, is_lose, event_id } = body;

        if (!name || value === undefined || count === undefined || !event_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const reward = await prisma.reward.create({
            data: {
                event_id,
                name,
                description,
                value: Number(value),
                count: Number(count),
                is_lose: Boolean(is_lose),
                probability: 0, // Initial value, will be updated
            },
        });

        await recalculateProbabilities(prisma, event_id);

        // Fetch the updated reward to return the correct probability
        const updatedReward = await prisma.reward.findUnique({
            where: { id: reward.id },
        });

        return NextResponse.json(updatedReward, { status: 201 });
    } catch (error) {
        console.error('Failed to create reward:', error);
        return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
    }
}
