import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://lottery.howlrs.net';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const events = await (prisma as any).event.findMany({
        where: { is_active: true },
        select: { slug: true, updated_at: true },
    });

    const eventEntries: MetadataRoute.Sitemap = events.map((event: { slug: string; updated_at: Date }) => ({
        url: `${BASE_URL}/events/${event.slug}`,
        lastModified: event.updated_at,
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    return [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...eventEntries,
    ];
}
