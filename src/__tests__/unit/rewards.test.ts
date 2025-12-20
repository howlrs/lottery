import { recalculateProbabilities } from '@/lib/rewards';

describe('recalculateProbabilities', () => {
    it('should correctly calculate probabilities for rewards', async () => {
        const rewards = [
            { id: '1', count: 10, probability: 0 },
            { id: '2', count: 30, probability: 0 },
        ];

        const mockUpdate = jest.fn();
        const mockTx = {
            reward: {
                findMany: jest.fn().mockResolvedValue(rewards),
                update: mockUpdate,
            },
        };

        await recalculateProbabilities(mockTx as any, 'event_1');

        expect(mockTx.reward.findMany).toHaveBeenCalledWith({
            where: { event_id: 'event_1' },
        });

        // Total count = 40.
        // Reward 1: (10 / 40) * 100 = 25
        // Reward 2: (30 / 40) * 100 = 75

        expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: '1' },
            data: { probability: 25 },
        });
        expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: '2' },
            data: { probability: 75 },
        });
    });

    it('should handle zero total count', async () => {
        const rewards = [
            { id: '1', count: 0, probability: 0 },
        ];

        const mockUpdate = jest.fn();
        const mockTx = {
            reward: {
                findMany: jest.fn().mockResolvedValue(rewards),
                update: mockUpdate,
            },
        };

        await recalculateProbabilities(mockTx as any, 'event_1');

        expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: '1' },
            data: { probability: 0 },
        });
    });

    it('should handle no rewards', async () => {
        const mockTx = {
            reward: {
                findMany: jest.fn().mockResolvedValue([]),
                update: jest.fn(),
            },
        };

        await recalculateProbabilities(mockTx as any, 'event_1');
        expect(mockTx.reward.update).not.toHaveBeenCalled();
    });
});
