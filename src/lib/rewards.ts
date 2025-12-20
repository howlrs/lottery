import { Prisma } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recalculateProbabilities(tx: any, event_id?: string) {
    if (!event_id) return; // Must scope by event

    // Fetch all rewards for this event
    const rewards = await tx.reward.findMany({
        where: { event_id }
    });

    if (rewards.length === 0) return;

    // Calculate total count
    const totalCount = rewards.reduce((sum: number, reward: { count: number }) => sum + reward.count, 0);

    // Update each reward
    for (const reward of rewards) {
        let probability = 0;
        if (totalCount > 0) {
            probability = (reward.count / totalCount) * 100;
        }

        // Round to 2 decimal places for cleaner display
        probability = Math.round(probability * 100) / 100;

        await tx.reward.update({
            where: { id: reward.id },
            data: { probability },
        });
    }
}
