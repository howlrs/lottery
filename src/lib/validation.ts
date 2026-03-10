export function sanitizeString(input: string, maxLength: number = 255): string {
    return input
        .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS in SVG
        .trim()
        .slice(0, maxLength);
}

export function isValidUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
