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
        const winLogs = await prisma.winLog.findMany({
            where: {
                reward: {
                    event_id: event_id,
                }
            } as any,
            include: {
                reward: true,
            },
            orderBy: {
                won_at: 'desc',
            } as any,
        });

        const headers = ['ID', 'Reward', 'Value', 'Token', 'Won At', 'Redeemed', 'Redeemed At'];
        const rows = winLogs.map((log: any) => [
            log.id,
            log.reward.name,
            log.reward.value,
            log.token,
            log.won_at.toISOString(),
            log.is_redeemed ? 'Yes' : 'No',
            log.redeemed_at ? log.redeemed_at.toISOString() : '',
        ]);

        const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="win-logs-${event_id}.csv"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
