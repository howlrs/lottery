
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { recalculateProbabilities } from '@/lib/rewards';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, value, count, is_lose } = body;

        const reward = await prisma.reward.update({
            where: { id },
            data: {
                name,
                description,
                value: value !== undefined ? Number(value) : undefined,
                count: count !== undefined ? Number(count) : undefined,
                is_lose: is_lose !== undefined ? Boolean(is_lose) : undefined,
                // Probability is updated via recalculation
            },
        });

        await recalculateProbabilities(prisma, reward.event_id);

        // Fetch updated reward
        const updatedReward = await prisma.reward.findUnique({
            where: { id },
        });

        return NextResponse.json(updatedReward);
    } catch (error) {
        console.error('Failed to update reward:', error);
        return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const reward = await prisma.reward.delete({
            where: { id },
        });

        await recalculateProbabilities(prisma, reward.event_id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete reward:', error);
        return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
    }
}
