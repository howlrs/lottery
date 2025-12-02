import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { rewardId } = body;

        if (!rewardId) {
            return NextResponse.json({ error: 'Missing rewardId' }, { status: 400 });
        }

        // Use a transaction to ensure stock is checked and decremented atomically
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const reward = await tx.reward.findUnique({
                where: { id: rewardId },
            });

            if (!reward) {
                throw new Error('Reward not found');
            }

            if (reward.count <= 0) {
                throw new Error('Reward out of stock');
            }

            const updatedReward = await tx.reward.update({
                where: { id: rewardId },
                data: { count: { decrement: 1 } },
            });

            const winLog = await tx.winLog.create({
                data: {
                    rewardId,
                },
            });

            return { reward: updatedReward, winLog };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Failed to claim reward:', error);
        return NextResponse.json({ error: error.message || 'Failed to claim reward' }, { status: 500 });
    }
}
