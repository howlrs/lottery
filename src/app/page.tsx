'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Event {
    id: string;
    title: string;
    slug: string;
    description: string;
    is_active: boolean;
}

export default function Home() {
    const { t } = useLanguage();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-8">{t.admin.events}</h1>

            {loading ? (
                <p>Loading events...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                    {events.map(event => (
                        <Link href={`/events/${event.slug}`} key={event.id} className="block group">
                            <div className="bg-white rounded-xl shadow-md p-6 transition transform group-hover:scale-105 group-hover:shadow-xl border border-transparent group-hover:border-blue-500">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">{event.title}</h2>
                                <p className="text-gray-600 mb-4">{event.description || 'No description'}</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${event.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {event.is_active ? 'Active' : 'Ended'}
                                </span>
                            </div>
                        </Link>
                    ))}

                    {events.length === 0 && (
                        <p className="text-gray-500 col-span-full text-center">No active events found.</p>
                    )}
                </div>
            )}

            <div className="mt-12">
                <Link href="/admin" className="text-blue-600 hover:underline">
                    {t.lottery.adminPanel}
                </Link>
            </div>
        </div>
    );
}
