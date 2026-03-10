import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
    it('should allow requests within limit', () => {
        const key = 'test-' + Date.now();
        expect(rateLimit(key, 3, 60000)).toBe(true);
        expect(rateLimit(key, 3, 60000)).toBe(true);
        expect(rateLimit(key, 3, 60000)).toBe(true);
    });

    it('should block requests exceeding limit', () => {
        const key = 'test-block-' + Date.now();
        rateLimit(key, 2, 60000);
        rateLimit(key, 2, 60000);
        expect(rateLimit(key, 2, 60000)).toBe(false);
    });

    it('should allow after window expires', async () => {
        const key = 'test-expire-' + Date.now();
        rateLimit(key, 1, 100); // 100ms window
        expect(rateLimit(key, 1, 100)).toBe(false);
        await new Promise(r => setTimeout(r, 150));
        expect(rateLimit(key, 1, 100)).toBe(true);
    });
});
