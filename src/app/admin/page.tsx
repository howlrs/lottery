'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, LogOut } from 'lucide-react';
import { showToast } from '@/components/Toast';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Event {
    id: string;
    title: string;
    slug: string;
    description: string;
    is_active: boolean;
    created_at: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { t } = useLanguage();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', slug: '', description: '' });

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent),
            });

            if (res.ok) {
                setNewEvent({ title: '', slug: '', description: '' });
                setIsCreating(false);
                fetchEvents();
            } else {
                showToast(t.admin.saveError, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast(t.admin.saveError, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-800">{t.admin.events}</h1>
                        <LanguageSwitcher />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                        >
                            <Plus size={20} /> {t.admin.newEvent}
                        </button>
                        <button
                            onClick={async () => {
                                await fetch('/api/auth/logout', { method: 'POST' });
                                router.push('/admin/login');
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600 transition"
                        >
                            <LogOut size={20} /> {t.admin.logout}
                        </button>
                    </div>
                </div>

                {isCreating && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-bold mb-4">{t.admin.newEvent}</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t.admin.title_label}</label>
                                <input
                                    type="text"
                                    required
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t.admin.slug_label}</label>
                                <input
                                    type="text"
                                    required
                                    value={newEvent.slug}
                                    onChange={e => setNewEvent({ ...newEvent, slug: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t.admin.description_label}</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    {t.admin.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {t.admin.createEvent}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div key={event.id} className="bg-white rounded-xl shadow-md p-6 border border-transparent hover:border-blue-500 transition">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h2>
                            <p className="text-sm text-gray-500 mb-4">/{event.slug}</p>
                            <p className="text-gray-600 mb-4">{event.description}</p>
                            <div className="flex justify-between items-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${event.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {event.is_active ? t.admin.active : t.admin.inactive}
                                </span>
                                <Link
                                    href={`/admin/events/${event.id}`}
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    {t.admin.manageEvent} &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
