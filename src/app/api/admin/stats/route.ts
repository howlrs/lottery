import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    if (!event_id) {
        return NextResponse.json({ error: 'Missing event_id' }, { status: 400 });
    }

    try {
        const rewards = await prisma.reward.findMany({
            where: { event_id },
            include: { win_logs: true },
        });

        const totalWins = rewards.reduce((sum, r) => sum + r.win_logs.length, 0);
        const totalRedeemed = rewards.reduce((sum, r) => sum + r.win_logs.filter((l: any) => l.is_redeemed).length, 0);

        const rewardStats = rewards.map(r => ({
            id: r.id,
            name: r.name,
            remaining: r.count,
            totalWon: r.win_logs.length,
            redeemed: r.win_logs.filter((l: any) => l.is_redeemed).length,
            is_lose: r.is_lose,
        }));

        return NextResponse.json({
            total_wins: totalWins,
            total_redeemed: totalRedeemed,
            redemption_rate: totalWins > 0 ? Math.round((totalRedeemed / totalWins) * 100) : 0,
            rewards: rewardStats,
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
