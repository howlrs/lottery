import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recalculateProbabilities } from '@/lib/rewards';

export async function GET() {
    try {
        const rewards = await prisma.reward.findMany({
            orderBy: {
                createdAt: 'desc',
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
        const { name, description, value, count } = body;

        if (!name || value === undefined || count === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const reward = await prisma.reward.create({
            data: {
                name,
                description,
                value: Number(value),
                count: Number(count),
                probability: 0, // Initial value, will be updated
            },
        });

        await recalculateProbabilities(prisma);

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
