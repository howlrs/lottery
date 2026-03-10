import { POST as verifyPost } from '@/app/api/admin/verify/route';
import { POST as redeemPost } from '@/app/api/admin/redeem/route';
import { GET as getWinLogs } from '@/app/api/admin/win-logs/route';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        winLog: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('/api/admin/verify', () => {
    it('should return 400 if token is missing', async () => {
        const req = new Request('http://localhost/api/admin/verify', {
            method: 'POST',
            body: JSON.stringify({}),
        });
        const res = await verifyPost(req);
        expect(res.status).toBe(400);
    });

    it('should return 404 for invalid token', async () => {
        (prisma.winLog.findFirst as jest.Mock).mockResolvedValue(null);
        const req = new Request('http://localhost/api/admin/verify', {
            method: 'POST',
            body: JSON.stringify({ token: 'invalid-token' }),
        });
        const res = await verifyPost(req);
        expect(res.status).toBe(404);
    });

    it('should return valid win log for valid token', async () => {
        const mockWinLog = {
            id: 'log-1',
            token: 'valid-token',
            is_redeemed: false,
            redeemed_at: null,
            won_at: new Date('2026-01-15T10:00:00Z'),
            reward: { name: 'Grand Prize' },
        };
        (prisma.winLog.findFirst as jest.Mock).mockResolvedValue(mockWinLog);

        const req = new Request('http://localhost/api/admin/verify', {
            method: 'POST',
            body: JSON.stringify({ token: 'valid-token' }),
        });
        const res = await verifyPost(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.valid).toBe(true);
        expect(data.win_log.reward_name).toBe('Grand Prize');
        expect(data.win_log.is_redeemed).toBe(false);
    });
});

describe('/api/admin/redeem', () => {
    it('should return 400 if token is missing', async () => {
        const req = new Request('http://localhost/api/admin/redeem', {
            method: 'POST',
            body: JSON.stringify({}),
        });
        const res = await redeemPost(req);
        expect(res.status).toBe(400);
    });

    it('should return 404 for invalid token', async () => {
        (prisma.winLog.findFirst as jest.Mock).mockResolvedValue(null);
        const req = new Request('http://localhost/api/admin/redeem', {
            method: 'POST',
            body: JSON.stringify({ token: 'invalid' }),
        });
        const res = await redeemPost(req);
        expect(res.status).toBe(404);
    });

    it('should return 400 if already redeemed', async () => {
        (prisma.winLog.findFirst as jest.Mock).mockResolvedValue({
            id: 'log-1',
            is_redeemed: true,
        });
        const req = new Request('http://localhost/api/admin/redeem', {
            method: 'POST',
            body: JSON.stringify({ token: 'redeemed-token' }),
        });
        const res = await redeemPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Token already redeemed');
    });

    it('should successfully redeem a valid token', async () => {
        const now = new Date();
        (prisma.winLog.findFirst as jest.Mock).mockResolvedValue({
            id: 'log-1',
            is_redeemed: false,
        });
        (prisma.winLog.update as jest.Mock).mockResolvedValue({
            id: 'log-1',
            is_redeemed: true,
            redeemed_at: now,
        });

        const req = new Request('http://localhost/api/admin/redeem', {
            method: 'POST',
            body: JSON.stringify({ token: 'valid-token' }),
        });
        const res = await redeemPost(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });
});

describe('/api/admin/win-logs', () => {
    it('should return 400 if event_id is missing', async () => {
        const req = new Request('http://localhost/api/admin/win-logs');
        const res = await getWinLogs(req);
        expect(res.status).toBe(400);
    });

    it('should return win logs for valid event_id', async () => {
        const mockLogs = [
            {
                id: 'log-1',
                token: 'token-1',
                is_redeemed: false,
                won_at: new Date(),
                reward: { name: 'Prize 1' },
            },
        ];
        (prisma.winLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

        const req = new Request('http://localhost/api/admin/win-logs?event_id=event-1');
        const res = await getWinLogs(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toHaveLength(1);
    });
});
