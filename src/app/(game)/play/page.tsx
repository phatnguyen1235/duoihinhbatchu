'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setQuestion, setQuestionTime, resetGame, setResult } from '@/store/slices/gameSlice';
import { QuestionDisplay } from '@/components/game/QuestionDisplay';
import { CountdownTimer } from '@/components/game/CountdownTimer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type GamePhase = 'loading' | 'playing' | 'showing_result' | 'finished' | 'error';

function PlayContent() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { currentQuestion, isCorrect, timeRemaining } = useAppSelector((state) => state.game);

    const [phase, setPhase] = useState<GamePhase>('loading');
    const [error, setError] = useState('');
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(5);
    const [score, setScore] = useState(0);
    const [roomId, setRoomId] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(0);

    const hasInitialized = useRef(false);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingNext = useRef(false);

    const handleExit = async () => {
        if (!confirm('Bạn có chắc muốn thoát? Tiến trình chơi sẽ bị hủy.')) return;

        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error('Logout error:', e);
        }
        dispatch(resetGame());
        router.push('/');
    };

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const fetchGame = async () => {
            try {
                const res = await fetch('/api/game/current', { credentials: 'include' });
                const data = await res.json();

                if (!res.ok) {
                    if (res.status === 401) {
                        router.push('/');
                        return;
                    }
                    setError(data.error || 'Không thể tải game');
                    setPhase('error');
                    return;
                }

                if (!data.question) {
                    setError('Không có câu hỏi');
                    setPhase('error');
                    return;
                }

                setRoomId(data.roomId);
                setCurrentRound(data.currentRound);
                setTotalRounds(data.totalRounds);
                setScore(data.score);
                dispatch(setQuestionTime(data.questionTime || 30));
                dispatch(setQuestion(data.question));
                setPhase('playing');

                if (data.gameFinished) {
                    setPhase('finished');
                }
            } catch (err) {
                setError(`Lỗi: ${err instanceof Error ? err.message : 'Unknown'}`);
                setPhase('error');
            }
        };

        fetchGame();
    }, [dispatch, router]);

    useEffect(() => {
        if (phase !== 'playing') return;
        if (timeRemaining !== 0 || isCorrect !== null || !roomId) return;
        if (isLoadingNext.current) return;

        const autoSubmit = async () => {
            try {
                const res = await fetch('/api/game/answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ roomId, answerText: '', roundNumber: currentRound }),
                });
                const data = await res.json();
                dispatch(setResult({
                    isCorrect: false,
                    correctAnswer: data.correctAnswer,
                    scoreGained: 0,
                }));
            } catch (e) {
                console.error('Auto-submit error:', e);
            }
        };
        autoSubmit();
    }, [timeRemaining, isCorrect, roomId, phase, dispatch]);

    useEffect(() => {
        if (phase !== 'playing') return;
        if (isCorrect === null) return;

        const timer = setTimeout(() => {
            setPhase('showing_result');
            setCountdown(3);
        }, 0);

        return () => clearTimeout(timer);
    }, [isCorrect, phase]);

    useEffect(() => {
        if (phase !== 'showing_result') return;
        if (countdown <= 0) return;

        countdownTimerRef.current = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => {
            if (countdownTimerRef.current) {
                clearTimeout(countdownTimerRef.current);
            }
        };
    }, [phase, countdown]);

    useEffect(() => {
        if (phase !== 'showing_result') return;
        if (countdown !== 0) return;
        if (isLoadingNext.current) return;

        // if (currentRound >= totalRounds) {
        //     setTimeout(() => setPhase('finished'), 0);
        //     return;
        // }

        const loadNext = async () => {
            if (!roomId) return;

            isLoadingNext.current = true;

            try {
                const res = await fetch('/api/game/next', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        roomId,
                        currentRound
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    if (data.gameFinished) {
                        setPhase('finished');
                    } else {
                        setError(data.error || 'Lỗi khi tải câu tiếp theo');
                        setPhase('error');
                    }
                    isLoadingNext.current = false;
                    return;
                }
                if (data.gameFinished) {
                    setScore(data.score); // Cập nhật điểm chuẩn lần cuối
                    setPhase('finished'); // Rồi mới cho nghỉ
                    isLoadingNext.current = false;
                    return;
                }
                setPhase('loading');
                dispatch(setQuestionTime(data.questionTime || 30));
                dispatch(setQuestion(data.question));
                setCurrentRound(data.currentRound);
                setScore(data.score);
                setPhase('playing');
                isLoadingNext.current = false;
            } catch (err) {
                setError(`Lỗi: ${err instanceof Error ? err.message : 'Unknown'}`);
                setPhase('error');
                isLoadingNext.current = false;
            }
        };

        loadNext();
    }, [phase, countdown, roomId, currentRound, totalRounds, dispatch]);

    useEffect(() => {
        if (phase !== 'finished' || !roomId) return;

        const timer = setTimeout(() => {
            router.push(`/result?roomId=${roomId}`);
        }, 1500);

        return () => clearTimeout(timer);
    }, [phase, roomId, router]);

    // --- Render Giao diện Tết ---

    if (phase === 'loading') {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 bg-white/90 p-6 rounded-xl shadow-2xl border-2 border-yellow-400">
                    <div className="animate-spin h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full" />
                    <span className="text-red-700 font-bold text-xl">Đang tải câu hỏi...</span>
                </div>
            </main>
        );
    }

    if (phase === 'error') {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full space-y-4 border-4 border-red-200">
                    <h2 className="text-xl font-bold text-red-600 uppercase text-center">Có lỗi xảy ra</h2>
                    <pre className="bg-red-50 p-3 rounded text-sm overflow-auto whitespace-pre-wrap text-red-800">
                        {error}
                    </pre>
                    <div className="text-xs text-gray-500 text-center">
                        <p>roomId: {roomId ?? 'null'}</p>
                        <p>round: {currentRound}/{totalRounds}</p>
                    </div>
                    <Button
                        onClick={() => router.push('/')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                        Về trang chủ
                    </Button>
                </div>
            </main>
        );
    }

    if (phase === 'finished') {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4 bg-white/95 p-12 rounded-3xl shadow-2xl border-4 border-yellow-400 animate-in zoom-in">
                    <h2 className="text-5xl md:text-6xl font-extrabold text-[#d32f2f] uppercase drop-shadow-sm">Hoàn thành!</h2>
                    <p className="text-3xl md:text-4xl font-bold text-gray-700 mt-6">Điểm của bạn: <span className="text-yellow-600 text-5xl">{score}</span></p>
                    <div className="animate-pulse text-red-500 font-medium text-xl mt-4">Đang chuyển đến kết quả...</div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-6 md:gap-8 w-full">

            {/* 👇 THANH THÔNG TIN TRÊN CÙNG (Size Đại)
                max-w-xl -> md:max-w-4xl (Rộng gấp đôi)
            */}
            <div className="flex items-center justify-between w-full max-w-md md:max-w-4xl bg-white/90 backdrop-blur-sm p-3 md:p-5 rounded-full shadow-lg border-2 border-yellow-400">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExit}
                    // Tăng size text + padding cho nút Thoát
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full px-4 md:px-6 text-sm md:text-xl h-10 md:h-12"
                >
                    ← Thoát
                </Button>

                {/* Badge Câu hỏi: Text to, padding dày */}
                <Badge variant="outline" className="text-base md:text-xl bg-red-100 text-red-700 border-red-200 px-4 md:px-6 py-2">
                    Câu <span className="font-bold ml-1.5">{currentRound}/{totalRounds}</span>
                </Badge>

                {/* Badge Điểm: Text to, padding dày */}
                <Badge className="text-base md:text-xl bg-yellow-400 hover:bg-yellow-500 text-red-800 px-4 md:px-6 py-2 shadow-sm">
                    {score} điểm
                </Badge>
            </div>

            {/* 👇 ĐỒNG HỒ ĐẾM NGƯỢC
                scale-110 -> md:scale-150 (Phóng to 1.5 lần trên tablet)
            */}
            <div className="scale-110 md:scale-150 my-2 md:my-6 transition-transform">
                <CountdownTimer />
            </div>

            {/* 👇 KHUNG CÂU HỎI CHÍNH
                max-w-xl -> md:max-w-4xl (Mở rộng không gian hiển thị)
            */}
            <div className="w-full max-w-md md:max-w-4xl">
                <QuestionDisplay roomId={roomId} currentRound={currentRound} />
            </div>

            {/* 👇 THÔNG BÁO CHUYỂN CÂU
                Phóng to chữ và padding
            */}
            {phase === 'showing_result' && countdown > 0 && (
                <div className="text-center bg-white/95 px-6 py-3 md:px-10 md:py-4 rounded-full shadow-lg animate-bounce border-2 border-yellow-300">
                    <p className="text-base md:text-2xl font-medium text-gray-800">
                        Câu tiếp theo trong <span className="font-extrabold text-red-600 text-lg md:text-3xl mx-2">{countdown}s</span>
                    </p>
                </div>
            )}
        </main>
    );
}

export default function PlayPage() {
    return (
        <ErrorBoundary>
            <PlayContent />
        </ErrorBoundary>
    );
}