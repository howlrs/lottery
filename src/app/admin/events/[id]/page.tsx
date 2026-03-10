'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Edit, Plus, Save, X, Scan, CheckCircle, AlertTriangle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { showToast } from '@/components/Toast';

interface Reward {
    id: string;
    event_id: string;
    name: string;
    description: string | null;
    value: number;
    count: number;
    probability: number;
    is_lose: boolean;
}

interface VerificationResult {
    id: string;
    reward_name: string;
    won_at: string;
    is_redeemed: boolean;
    redeemed_at?: string;
}

interface WinLog {
    id: string;
    reward_id: string;
    reward: {
        name: string;
    };
    token: string;
    is_redeemed: boolean;
    redeemed_at: string | null;
    won_at: string;
}

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback } from 'react';

export default function AdminEventPage() {
    const params = useParams();
    const eventId = params?.id as string;

    const { t } = useLanguage();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [winLogs, setWinLogs] = useState<WinLog[]>([]);

    // Redemption State
    const [tokenInput, setTokenInput] = useState('');
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const fetchRewards = useCallback(async () => {
        try {
            const res = await fetch(`/api/rewards?event_id=${eventId}`);
            if (!res.ok) {
                throw new Error(t.admin.fetchError);
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
    }, [eventId, t.admin.fetchError]);

    const fetchWinLogs = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/win-logs?event_id=${eventId}`);
            if (!res.ok) throw new Error('Failed to fetch win logs');
            const data = await res.json();
            setWinLogs(data);
        } catch (error) {
            console.error('Failed to fetch win logs', error);
        }
    }, [eventId]);

    const verifyToken = useCallback(async (token: string) => {
        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const data = await res.json();
            if (res.ok) {
                setVerificationResult(data.win_log);
            } else {
                showToast(data.error, 'error');
                setVerificationResult(null);
            }
        } catch (error) {
            console.error('Verification failed', error);
            showToast(t.admin.redemptionError, 'error');
        }
    }, [t.admin.redemptionError]);

    const handleRedeem = useCallback(async () => {
        if (!verificationResult) return;
        if (!confirm(t.admin.redeemConfirm)) return;

        try {
            const res = await fetch('/api/admin/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenInput }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(t.admin.redemptionSuccess, 'success');
                // Refresh verification result to show updated status
                verifyToken(tokenInput);
                fetchWinLogs(); // Refresh the list
            } else {
                showToast(data.error, 'error');
            }
        } catch (error) {
            console.error('Redemption failed', error);
            showToast(t.admin.redemptionError, 'error');
        }
    }, [verificationResult, tokenInput, verifyToken, fetchWinLogs, t.admin.redeemConfirm, t.admin.redemptionSuccess, t.admin.redemptionError]);

    const handleScanSuccess = useCallback((decodedText: string) => {
        setTokenInput(decodedText);
        setShowScanner(false);
        verifyToken(decodedText);
    }, [verifyToken]);

    const handleScanFailure = useCallback(() => {
        // Silent failure is often preferred for scanner log spam
    }, []);

    useEffect(() => {
        fetchRewards();
        fetchWinLogs();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [fetchRewards, fetchWinLogs]);

    useEffect(() => {
        if (showScanner && !scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );
            scanner.render(handleScanSuccess, handleScanFailure);
            scannerRef.current = scanner;
        } else if (!showScanner && scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
    }, [showScanner, handleScanSuccess]);


    const handleDelete = async (id: string) => {
        if (!confirm(t.admin.deleteConfirm)) return;
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
                body: JSON.stringify({ ...editingReward, event_id: eventId }),
            });

            if (!res.ok) throw new Error(t.admin.saveError);

            setEditingReward(null);
            setIsCreating(false);
            fetchRewards();
        } catch (error) {
            console.error('Failed to save reward', error);
            showToast(t.admin.saveError, 'error');
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
            is_lose: false,
        });
        setIsCreating(true);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/admin" className="text-blue-600 hover:underline mb-4 inline-block">&larr; {t.admin.backToEvents}</Link>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">{t.admin.title} (Event: {eventId})</h1>
                        <LanguageSwitcher />
                    </div>
                    <button
                        onClick={startCreate}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Plus size={20} /> {t.admin.addReward}
                    </button>
                </div>
            </div>

            {/* Redemption Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">{t.admin.redemptionTitle}</h2>
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder={t.admin.tokenPlaceholder}
                            className="flex-1 p-2 border rounded"
                        />
                        <button
                            onClick={() => verifyToken(tokenInput)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            {t.admin.verify}
                        </button>
                        <button
                            onClick={() => setShowScanner(!showScanner)}
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Scan size={20} /> {showScanner ? t.admin.closeScanner : t.admin.scanQR}
                        </button>
                    </div>

                    {showScanner && (
                        <div className="mb-4 p-4 border rounded bg-gray-50">
                            <div id="reader" className="w-full"></div>
                        </div>
                    )}

                    {verificationResult && (
                        <div className={`p-4 rounded border ${verificationResult.is_redeemed ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">{verificationResult.reward_name}</h3>
                                    <p className="text-sm text-gray-600">{t.admin.wonAt}: {new Date(verificationResult.won_at).toLocaleString()}</p>
                                    <p className="text-sm text-gray-600 mt-1">ID: {verificationResult.id}</p>

                                    {verificationResult.is_redeemed ? (
                                        <div className="mt-3 flex items-center gap-2 text-yellow-700">
                                            <AlertTriangle size={20} />
                                            <span className="font-bold">{t.admin.alreadyRedeemed} {new Date(verificationResult.redeemed_at!).toLocaleString()}</span>
                                        </div>
                                    ) : (
                                        <div className="mt-3 flex items-center gap-2 text-green-700">
                                            <CheckCircle size={20} />
                                            <span className="font-bold">{t.admin.validToken}</span>
                                        </div>
                                    )}
                                </div>

                                {!verificationResult.is_redeemed && (
                                    <button
                                        onClick={handleRedeem}
                                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-green-700"
                                    >
                                        {t.admin.redeemPrize}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t.admin.rewardsManagement}</h2>
            </div>

            {loading ? (
                <div className="text-center py-8">{t.admin.loading}</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.name}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.value}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.stock}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.prob}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.isLose}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {rewards.map((reward) => (
                                <tr key={reward.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reward.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reward.value}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reward.count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reward.probability}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reward.is_lose ? 'Yes' : 'No'}</td>
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
                            <h2 className="text-xl font-bold">{isCreating ? t.admin.newReward : t.admin.editReward}</h2>
                            <button onClick={() => setEditingReward(null)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t.admin.name}</label>
                                <input
                                    type="text"
                                    value={editingReward.name || ''}
                                    onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t.admin.description}</label>
                                <input
                                    type="text"
                                    value={editingReward.description || ''}
                                    onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.admin.value}</label>
                                    <input
                                        type="number"
                                        value={editingReward.value || 0}
                                        onChange={(e) => setEditingReward({ ...editingReward, value: Number(e.target.value) })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.admin.stock}</label>
                                    <input
                                        type="number"
                                        value={editingReward.count || 0}
                                        onChange={(e) => setEditingReward({ ...editingReward, count: Number(e.target.value) })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={editingReward.is_lose || false}
                                        onChange={(e) => setEditingReward({ ...editingReward, is_lose: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    {t.admin.isLose}
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingReward(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                {t.admin.cancel}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Save size={16} /> {t.admin.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.admin.winHistory}</h2>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.name}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.token}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.wonAt}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.status}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {winLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.reward.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{log.token.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.won_at).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.is_redeemed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {log.is_redeemed ? t.admin.redeemed : t.admin.pending}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {!log.is_redeemed && (
                                            <button
                                                onClick={() => {
                                                    setTokenInput(log.token);
                                                    verifyToken(log.token);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                {t.admin.redeem}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {winLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t.admin.noWinLogs}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
