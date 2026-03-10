import { POST } from '@/app/api/claim/route';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        $transaction: jest.fn(),
        reward: {
            findUnique: jest.fn(),
        },
    },
}));

describe('/api/claim API Endpoint', () => {
    it('should return 400 if reward_id is missing', async () => {
        const req = new Request('http://localhost/api/claim', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing reward_id');
    });

    it('should correctly process a winning reward claim', async () => {
        const mockReward = {
            id: '550e8400-e29b-41d4-a716-446655440000',
            count: 10,
            is_lose: false,
            name: 'Prizes'
        };
        const mockUpdatedReward = { ...mockReward, count: 9 };
        const mockWinLog = { id: 'log-1', token: 'token-123' };

        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
            const tx = {
                reward: {
                    findUnique: jest.fn().mockResolvedValue(mockReward),
                    update: jest.fn().mockResolvedValue(mockUpdatedReward),
                },
                winLog: {
                    create: jest.fn().mockResolvedValue(mockWinLog),
                },
            };
            return callback(tx);
        });

        const req = new Request('http://localhost/api/claim', {
            method: 'POST',
            body: JSON.stringify({ reward_id: '550e8400-e29b-41d4-a716-446655440000' }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.reward.count).toBe(9);
        expect(data.win_log.token).toBe('token-123');
    });

    it('should return null win_log and skip creation for lose rewards', async () => {
        const mockReward = {
            id: '660e8400-e29b-41d4-a716-446655440000',
            count: 100,
            is_lose: true,
            name: 'Lose'
        };
        const mockUpdatedReward = { ...mockReward, count: 99 };

        let winLogCreated = false;

        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
            const tx = {
                reward: {
                    findUnique: jest.fn().mockResolvedValue(mockReward),
                    update: jest.fn().mockResolvedValue(mockUpdatedReward),
                },
                winLog: {
                    create: jest.fn().mockImplementation(() => {
                        winLogCreated = true;
                        return {};
                    }),
                },
            };
            return callback(tx);
        });

        const req = new Request('http://localhost/api/claim', {
            method: 'POST',
            body: JSON.stringify({ reward_id: '660e8400-e29b-41d4-a716-446655440000' }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.win_log).toBeNull();
        expect(winLogCreated).toBe(false);
    });
});
