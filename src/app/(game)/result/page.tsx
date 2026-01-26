'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { leaveRoom } from '@/store/slices/roomSlice';
import { resetGame } from '@/store/slices/gameSlice';
import { ResultCard } from '@/components/game/ResultCard';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface PlayerResult {
    rank: number;
    playerId: number;
    score: number;
    correctCount: number;
    totalAnswered: number;
    totalRounds: number;
    isCurrentUser: boolean;
    answers: {
        round: number;
        isCorrect: boolean | null;
        userAnswer: string | null;
        correctAnswer: string;
    }[];
}

function ResultContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const roomId = searchParams.get('roomId');
    const [results, setResults] = useState<PlayerResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!roomId) {
            router.push('/');
            return;
        }

        const fetchResults = async () => {
            try {
                const res = await fetch(`/api/game/results?roomId=${roomId}`, {
                    credentials: 'include',
                });
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || 'Lỗi khi tải kết quả');
                    return;
                }

                setResults(data.results);
            } catch {
                setError('Lỗi kết nối');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [roomId, router]);

    const handleBackToHome = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error('Logout error:', e);
        }
        dispatch(leaveRoom());
        dispatch(resetGame());
        router.push('/');
    };

    // --- LOADING VIEW ---
    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 bg-white/95 p-8 rounded-2xl border-4 border-[#ffcc00] shadow-2xl">
                    <div className="animate-spin h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full" />
                    <span className="text-red-700 font-bold text-xl">Đang tính điểm...</span>
                </div>
            </main>
        );
    }

    // --- ERROR VIEW ---
    if (error) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white/95 p-8 rounded-2xl border-4 border-red-300 shadow-2xl text-center space-y-6 max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 uppercase">Có lỗi xảy ra</h2>
                    <p className="text-gray-700 font-medium">{error}</p>
                    <Button
                        onClick={handleBackToHome}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl"
                    >
                        Về trang chủ
                    </Button>
                </div>
            </main>
        );
    }

    const currentUserResult = results.find((r) => r.isCurrentUser);

    // --- MAIN RESULT VIEW ---
    return (
        // 👇 Xóa gradient, để nền trong suốt (flex items-center)
        <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-6 w-full">

            {/* Container chính: Màu trắng mờ, viền vàng, bóng đổ đậm */}
            <div className="w-full max-w-md md:max-w-3xl bg-white/95 backdrop-blur-sm p-6 md:p-10 rounded-3xl shadow-2xl border-4 border-[#ffcc00] flex flex-col items-center gap-6 md:gap-8 animate-in zoom-in duration-300">

                {/* Header Kết Quả */}
                <div className="relative">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-[#d32f2f] uppercase drop-shadow-sm text-center">
                        Tổng Kết
                    </h1>
                    <div className="absolute -right-8 -top-4 text-3xl md:text-5xl animate-bounce hidden md:block">🎉</div>
                    <div className="absolute -left-8 -top-4 text-3xl md:text-5xl animate-bounce hidden md:block scale-x-[-1]">🎉</div>
                </div>

                {/* Box hiển thị điểm số cá nhân */}
                {currentUserResult && (
                    <div className="w-full bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-lg md:text-2xl text-gray-600 font-serif mb-2">
                                Thứ hạng của bạn
                            </p>

                            {/* Rank to đùng */}
                            <div className="text-5xl md:text-7xl font-black text-[#d32f2f] mb-4 drop-shadow-md">
                                #{currentUserResult.rank}
                            </div>

                            <div className="flex justify-center gap-4 md:gap-12 text-base md:text-xl">
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-yellow-600 text-2xl md:text-4xl">{currentUserResult.score}</span>
                                    <span className="text-gray-500 uppercase text-xs md:text-sm font-bold">Điểm số</span>
                                </div>
                                <div className="w-px bg-red-200 h-full"></div>
                                <div className="flex flex-col items-center">
                         <span className="font-bold text-green-600 text-2xl md:text-4xl">
                            {currentUserResult.correctCount}/{currentUserResult.totalRounds}
                         </span>
                                    <span className="text-gray-500 uppercase text-xs md:text-sm font-bold">Câu đúng</span>
                                </div>
                            </div>
                        </div>

                        {/* Họa tiết chìm */}
                        <div className="absolute top-0 right-0 opacity-10 w-24 h-24 transform translate-x-1/3 -translate-y-1/3">
                            <Image src="/logo/lixco-logo-1.svg" alt="bg" width={100} height={100} />
                        </div>
                    </div>
                )}

                {/* Bảng chi tiết kết quả (Component ResultCard cần style lại ở file đó, nhưng tạm thời container này sẽ lo phần nền) */}
                <div className="w-full">
                    <h3 className="text-center text-gray-500 font-bold uppercase text-xs md:text-sm mb-2 tracking-widest">Chi tiết câu trả lời</h3>
                    <ResultCard results={results} />
                </div>

                {/* Nút Về trang chủ (Style vàng đỏ) */}
                <Button
                    onClick={handleBackToHome}
                    className="w-full md:w-auto md:px-12 h-12 md:h-16 bg-[#ffcc00] hover:bg-[#ffdb4d] text-[#cc0000] font-bold text-lg md:text-2xl rounded-xl shadow-lg uppercase transition-transform hover:scale-105"
                >
                    🏠 Về trang chủ
                </Button>
            </div>
        </main>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 bg-white/90 p-6 rounded-xl border-2 border-yellow-400">
                    <div className="animate-spin h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full" />
                    <span className="text-red-700 font-bold">Đang tải...</span>
                </div>
            </main>
        }>
            <ResultContent />
        </Suspense>
    );
}