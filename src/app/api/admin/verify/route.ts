import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const winLog = await prisma.winLog.findFirst({
            where: { token },
            include: { reward: true },
        });

        if (!winLog) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
        }

        return NextResponse.json({
            valid: true,
            win_log: {
                id: winLog.id,
                reward_name: winLog.reward.name,
                won_at: winLog.won_at,
                is_redeemed: winLog.is_redeemed,
                redeemed_at: winLog.redeemed_at,
            }
        });

    } catch (error: unknown) {
        console.error('Verify error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Verification failed' }, { status: 500 });
    }
}
