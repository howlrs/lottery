import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { reward_id } = body;

        if (!reward_id) {
            return NextResponse.json({ error: 'Missing reward_id' }, { status: 400 });
        }

        // Use a transaction to ensure stock is checked and decremented atomically
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const reward = await tx.reward.findUnique({
                where: { id: reward_id },
            });

            if (!reward) {
                throw new Error('Reward not found');
            }

            if (reward.count <= 0) {
                throw new Error('Reward out of stock');
            }

            const updatedReward = await tx.reward.update({
                where: { id: reward_id },
                data: { count: { decrement: 1 } },
            });

            if ((reward as any).is_lose) {
                return { reward: updatedReward, win_log: null };
            }

            const winLog = await tx.winLog.create({
                data: {
                    reward_id: reward_id,
                } as any,
            });

            return { reward: updatedReward, win_log: winLog };
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Failed to claim reward:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to claim reward' }, { status: 500 });
    }
}
