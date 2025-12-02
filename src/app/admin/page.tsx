'use client';

import { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';

interface Reward {
    id: string;
    name: string;
    description: string | null;
    value: number;
    count: number;
    probability: number;
}

export default function AdminPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const res = await fetch('/api/rewards');
            if (!res.ok) {
                throw new Error('Failed to fetch rewards');
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setRewards(data);
            } else {
                console.error('Received invalid data format:', data);
                setRewards([]);
            }
        } catch (error) {
            console.error('Failed to fetch rewards', error);
            setRewards([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this reward?')) return;
        try {
            await fetch(`/api/rewards/${id}`, { method: 'DELETE' });
            fetchRewards();
        } catch (error) {
            console.error('Failed to delete reward', error);
        }
    };

    const handleSave = async () => {
        if (!editingReward) return;

        try {
            const method = isCreating ? 'POST' : 'PUT';
            const url = isCreating ? '/api/rewards' : `/api/rewards/${editingReward.id}`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingReward),
            });

            if (!res.ok) throw new Error('Failed to save');

            setEditingReward(null);
            setIsCreating(false);
            fetchRewards();
        } catch (error) {
            console.error('Failed to save reward', error);
            alert('Failed to save reward');
        }
    };

    const startEdit = (reward: Reward) => {
        setEditingReward(reward);
        setIsCreating(false);
    };

    const startCreate = () => {
        setEditingReward({
            name: '',
            description: '',
            value: 0,
            count: 0,
        });
        setIsCreating(true);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Reward Management</h1>
                    <button
                        onClick={startCreate}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Plus size={20} /> Add Reward
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prob (%)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {rewards.map((reward) => (
                                    <tr key={reward.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reward.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reward.value}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reward.count}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reward.probability}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => startEdit(reward)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(reward.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {editingReward && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">{isCreating ? 'New Reward' : 'Edit Reward'}</h2>
                                <button onClick={() => setEditingReward(null)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={editingReward.name || ''}
                                        onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <input
                                        type="text"
                                        value={editingReward.description || ''}
                                        onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Value</label>
                                        <input
                                            type="number"
                                            value={editingReward.value || 0}
                                            onChange={(e) => setEditingReward({ ...editingReward, value: Number(e.target.value) })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Stock</label>
                                        <input
                                            type="number"
                                            value={editingReward.count || 0}
                                            onChange={(e) => setEditingReward({ ...editingReward, count: Number(e.target.value) })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingReward(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Save size={16} /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
