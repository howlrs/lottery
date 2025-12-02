'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface Reward {
    id: string;
    name: string;
    description?: string;
    value: number;
    count: number;
    probability: number;
}

export default function LotteryPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isWaiting, setIsWaiting] = useState(false);
    const [spinning, setSpinning] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<Reward | null>(null);
    const [loading, setLoading] = useState(true);
    const wheelRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const speedRef = useRef(0);

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const res = await fetch('/api/rewards');
            const data = await res.json();
            // Filter out rewards with 0 stock or 0 probability
            const available = data.filter((r: Reward) => r.count > 0 && r.probability > 0);
            setRewards(available);
        } catch (error) {
            console.error('Failed to fetch rewards', error);
        } finally {
            setLoading(false);
        }
    };

    const startSpin = () => {
        if (spinning || isWaiting || rewards.length === 0) return;

        setIsWaiting(true);
        setResult(null);

        // Wait for 2 seconds before starting rotation
        setTimeout(() => {
            setIsWaiting(false);
            setSpinning(true);
            setIsStopping(false);
            speedRef.current = 20; // Initial speed (degrees per frame)

            const animate = () => {
                setRotation(prev => (prev + speedRef.current) % 360);
                animationRef.current = requestAnimationFrame(animate);
            };
            animationRef.current = requestAnimationFrame(animate);
        }, 2000);
    };

    const stopSpin = () => {
        if (!spinning || isStopping) return;
        setIsStopping(true);

        // Determine result
        const totalProb = rewards.reduce((sum, r) => sum + r.probability, 0);
        let random = Math.random() * totalProb;
        let selectedReward = rewards[0];

        for (const reward of rewards) {
            if (random < reward.probability) {
                selectedReward = reward;
                break;
            }
            random -= reward.probability;
        }

        // Calculate target angle
        let angleStart = 0;
        for (const r of rewards) {
            if (r.id === selectedReward.id) break;
            angleStart += (r.probability / totalProb) * 360;
        }
        const angleSize = (selectedReward.probability / totalProb) * 360;
        const targetAngleInWheel = angleStart + angleSize / 2;

        // We want to stop at targetAngleInWheel.
        // Current rotation is `rotation`.
        // We need to decelerate.
        // Let's do a simple ease-out animation to the target.

        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        // Current rotation
        const currentRotation = rotation;
        // Calculate distance to target (ensure it's at least a few spins away)
        // Target rotation should be: (some multiple of 360) + (360 - targetAngleInWheel)
        // Because pointer is at top (0/360), and wheel rotates clockwise.
        // When wheel is at `r`, the item at top is `(360 - r % 360) % 360`.
        // We want that to be `targetAngleInWheel`.
        // So `r % 360` should be `360 - targetAngleInWheel`.

        const targetMod = (360 - targetAngleInWheel) % 360;
        const currentMod = currentRotation % 360;

        let distance = targetMod - currentMod;
        if (distance < 0) distance += 360;

        // Add extra spins for smooth stop
        distance += 360 * 3; // 3 full spins

        const duration = 3000; // 3 seconds
        const startTime = performance.now();
        const startRotation = currentRotation;

        const animateStop = (time: number) => {
            const elapsed = time - startTime;
            if (elapsed >= duration) {
                setRotation(startRotation + distance);
                setSpinning(false);
                setIsStopping(false);
                claimReward(selectedReward);
                return;
            }

            // Ease out cubic
            const t = elapsed / duration;
            const ease = 1 - Math.pow(1 - t, 3);

            setRotation(startRotation + distance * ease);
            animationRef.current = requestAnimationFrame(animateStop);
        };

        animationRef.current = requestAnimationFrame(animateStop);
    };

    const claimReward = async (reward: Reward) => {
        try {
            const res = await fetch('/api/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rewardId: reward.id }),
            });

            if (res.ok) {
                setResult(reward);
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                // Refresh rewards to update stock
                fetchRewards();
            } else {
                const err = await res.json();
                alert('Error claiming reward: ' + err.error);
            }
        } catch (error) {
            console.error('Failed to claim', error);
            alert('Failed to claim reward');
        }
    };

    // Helper to render wheel segments
    const renderWheel = () => {
        if (rewards.length === 0) return null;

        const totalProb = rewards.reduce((sum, r) => sum + r.probability, 0);
        let currentAngle = 0;

        return (
            <div
                className="relative w-full h-full rounded-full overflow-hidden shadow-xl border-4 border-gray-800 transition-transform duration-[5000ms] ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {rewards.map((reward, index) => {
                    const angleSize = (reward.probability / totalProb) * 360;
                    const skewY = 90 - angleSize;
                    const rotate = currentAngle;
                    currentAngle += angleSize;

                    // Use conic-gradient for simpler rendering if many segments, 
                    // but for text we need absolute positioning.
                    // Let's use SVG for better control over segments and text.
                    return null;
                })}
                {/* SVG Implementation */}
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {rewards.map((reward, index) => {
                        const angleSize = (reward.probability / totalProb) * 360;
                        const startAngle = currentAngle - angleSize; // currentAngle was incremented in loop above? No, let's recalculate.
                        // Actually let's do the loop cleanly.
                        return null;
                    })}
                </svg>
            </div>
        );
    };

    // Re-implement render with cleaner logic
    const getSegments = () => {
        const totalProb = rewards.reduce((sum, r) => sum + r.probability, 0);
        let currentAngle = 0;
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98FB98', '#DDA0DD', '#F0E68C'];

        return rewards.map((reward, index) => {
            const angleSize = (reward.probability / totalProb) * 360;
            const startAngle = currentAngle;
            currentAngle += angleSize;

            // Calculate SVG path for arc
            const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
            const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
            const x2 = 50 + 50 * Math.cos(Math.PI * (startAngle + angleSize) / 180);
            const y2 = 50 + 50 * Math.sin(Math.PI * (startAngle + angleSize) / 180);

            const largeArcFlag = angleSize > 180 ? 1 : 0;

            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            // Text position (midpoint of arc, slightly inwards)
            const midAngle = startAngle + angleSize / 2;
            const textRadius = 35;
            const tx = 50 + textRadius * Math.cos(Math.PI * midAngle / 180);
            const ty = 50 + textRadius * Math.sin(Math.PI * midAngle / 180);

            return (
                <g key={reward.id}>
                    <path d={pathData} fill={colors[index % colors.length]} stroke="white" strokeWidth="0.5" />
                    <text
                        x={tx}
                        y={ty}
                        fill="white"
                        fontSize="4"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                        className="font-bold pointer-events-none select-none"
                    >
                        {reward.name}
                    </text>
                </g>
            );
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-bold text-white mb-8">Lottery Challenge</h1>

            <div className="relative w-80 h-80 sm:w-96 sm:h-96 mb-12">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10 w-8 h-10 bg-yellow-400" style={{ clipPath: 'polygon(100% 0, 50% 100%, 0 0)' }}></div>

                {/* Wheel */}
                <div
                    className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {loading ? (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading...</div>
                    ) : rewards.length > 0 ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            {getSegments()}
                        </svg>
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">No Rewards</div>
                    )}
                </div>
            </div>

            <button
                onClick={spinning && !isStopping ? stopSpin : startSpin}
                disabled={isStopping || isWaiting || rewards.length === 0}
                className={`px-8 py-4 text-2xl font-bold rounded-full shadow-lg transform transition hover:scale-105 ${isStopping || rewards.length === 0 || isWaiting
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : spinning
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gradient-to-r from-pink-500 to-yellow-500 text-white hover:from-pink-600 hover:to-yellow-600'
                    }`}
            >
                {isWaiting ? 'Spinning...' : isStopping ? 'Stopping...' : spinning ? 'STOP!' : 'SPIN!'}
            </button>

            {result && (
                <div className="mt-8 p-6 bg-white rounded-xl shadow-2xl text-center animate-bounce">
                    <h2 className="text-2xl font-bold text-gray-800">Congratulations!</h2>
                    <p className="text-xl text-purple-600 mt-2">You won: {result.name}</p>
                    <p className="text-gray-500 mt-1">{result.description}</p>
                </div>
            )}

            <div className="mt-12 text-gray-400 text-sm">
                <a href="/admin" className="hover:text-white underline">Admin Panel</a>
            </div>
        </div>
    );
}
