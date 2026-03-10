import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const winLog = await prisma.winLog.findFirst({
            where: { token },
        });

        if (!winLog) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
        }

        if (winLog.is_redeemed) {
            return NextResponse.json({ error: 'Token already redeemed' }, { status: 400 });
        }

        const updated = await prisma.winLog.update({
            where: { id: winLog.id },
            data: {
                is_redeemed: true,
                redeemed_at: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            redeemed_at: updated.redeemed_at,
        });

    } catch (error: unknown) {
        console.error('Redeem error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Redemption failed' }, { status: 500 });
    }
}
