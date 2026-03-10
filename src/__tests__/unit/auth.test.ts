import { requireAdmin } from '@/lib/auth';

describe('requireAdmin', () => {
    const originalEnv = process.env;

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should return null when ADMIN_SECRET is not set (dev mode)', () => {
        delete process.env.ADMIN_SECRET;
        const req = new Request('http://localhost/api/admin/test');
        expect(requireAdmin(req)).toBeNull();
    });

    it('should return 401 when no Authorization header', () => {
        process.env.ADMIN_SECRET = 'test-secret';
        const req = new Request('http://localhost/api/admin/test');
        const res = requireAdmin(req);
        expect(res).not.toBeNull();
        expect(res!.status).toBe(401);
    });

    it('should return 403 when token is wrong', () => {
        process.env.ADMIN_SECRET = 'test-secret';
        const req = new Request('http://localhost/api/admin/test', {
            headers: { Authorization: 'Bearer wrong-token' },
        });
        const res = requireAdmin(req);
        expect(res).not.toBeNull();
        expect(res!.status).toBe(403);
    });

    it('should return null when token is correct', () => {
        process.env.ADMIN_SECRET = 'test-secret';
        const req = new Request('http://localhost/api/admin/test', {
            headers: { Authorization: 'Bearer test-secret' },
        });
        expect(requireAdmin(req)).toBeNull();
    });
});
