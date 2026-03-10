import { sanitizeString, isValidUUID } from '@/lib/validation';

describe('sanitizeString', () => {
    it('should remove angle brackets', () => {
        expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should trim whitespace', () => {
        expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should truncate to max length', () => {
        expect(sanitizeString('a'.repeat(300), 10)).toBe('a'.repeat(10));
    });

    it('should handle empty string', () => {
        expect(sanitizeString('')).toBe('');
    });
});

describe('isValidUUID', () => {
    it('should return true for valid UUID', () => {
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return false for invalid string', () => {
        expect(isValidUUID('not-a-uuid')).toBe(false);
    });

    it('should return false for empty string', () => {
        expect(isValidUUID('')).toBe(false);
    });
});
