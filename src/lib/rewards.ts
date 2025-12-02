import { PrismaClient } from '@prisma/client';

export async function recalculateProbabilities(prisma: PrismaClient | any) {
    // Fetch all rewards
    const rewards = await prisma.reward.findMany();

    if (rewards.length === 0) return;

    // Calculate total count
    const totalCount = rewards.reduce((sum: number, reward: any) => sum + reward.count, 0);

    // Update each reward
    for (const reward of rewards) {
        let probability = 0;
        if (totalCount > 0) {
            probability = (reward.count / totalCount) * 100;
        }

        // Round to 2 decimal places for cleaner display
        probability = Math.round(probability * 100) / 100;

        await prisma.reward.update({
            where: { id: reward.id },
            data: { probability },
        });
    }
}
