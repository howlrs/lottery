import type { Metadata } from 'next';
import prisma from '@/lib/prisma';

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

    return {
        title: event.title,
        description: event.description || `Join the ${event.title} lottery!`,
        openGraph: {
            title: event.title,
            description: event.description || `Join the ${event.title} lottery!`,
        },
    };
}

export default function EventLayout({ children }: Props) {
    return <>{children}</>;
}
