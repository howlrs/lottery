import type { Metadata } from 'next';
import prisma from '@/lib/prisma';

const BASE_URL = 'https://lottery.howlrs.net';

type Props = {
    params: Promise<{ slug: string }>;
    children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const event = await (prisma as any).event.findFirst({ where: { slug } });

    if (!event) {
        return { title: 'Event Not Found' };
    }

    const description = event.description || `Join the ${event.title} lottery!`;
    const url = `${BASE_URL}/events/${slug}`;

    return {
        title: event.title,
        description,
        alternates: {
            canonical: `/events/${slug}`,
        },
        openGraph: {
            title: event.title,
            description,
            url,
            type: 'article',
        },
        twitter: {
            card: 'summary',
            title: event.title,
            description,
        },
    };
}

export default function EventLayout({ children }: Props) {
    return <>{children}</>;
}
