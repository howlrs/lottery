
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recalculateProbabilities } from '@/lib/rewards';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, value, count, is_lose } = body;

        const result = await prisma.$transaction(async (tx) => {
            const reward = await tx.reward.update({
                where: { id },
                data: {
                    name,
                    description,
                    value: value !== undefined ? Number(value) : undefined,
                    count: count !== undefined ? Number(count) : undefined,
                    is_lose: is_lose !== undefined ? Boolean(is_lose) : undefined,
                },
            });

            await recalculateProbabilities(tx, reward.event_id);

            return await tx.reward.findUnique({
                where: { id },
            });
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to update reward:', error);
        return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const { id } = await params;

        await prisma.$transaction(async (tx) => {
            const reward = await tx.reward.delete({
                where: { id },
            });

            await recalculateProbabilities(tx, reward.event_id);
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete reward:', error);
        return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
    }
}
