'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setQuestion, setQuestionTime, resetGame, setResult } from '@/store/slices/gameSlice';
import { QuestionDisplay } from '@/components/game/QuestionDisplay';
import { CountdownTimer } from '@/components/game/CountdownTimer';
import { Badge } from '@/components/ui/badge';
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

    // Refs to track state
    const hasInitialized = useRef(false);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingNext = useRef(false);

    // 1. Initialize game
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

    // 2. Auto-submit when time runs out
    useEffect(() => {
        if (phase !== 'playing') return;
        if (timeRemaining !== 0 || isCorrect !== null || !roomId) return;
        // Không auto-submit nếu đang load câu tiếp theo
        if (isLoadingNext.current) return;

        const autoSubmit = async () => {
            try {
                const res = await fetch('/api/game/answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ roomId, answerText: '' }),
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

    // 3. When user answers, switch to showing_result phase and start countdown
    useEffect(() => {
        if (phase !== 'playing') return;
        if (isCorrect === null) return;

        // FIX: Dùng setTimeout để tránh lỗi "setState synchronously" của ESLint
        const timer = setTimeout(() => {
            setPhase('showing_result');
            setCountdown(3);
        }, 0);

        return () => clearTimeout(timer);
    }, [isCorrect, phase]);

    // 4. Countdown during showing_result phase
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

    // 5. When countdown reaches 0 in showing_result phase, load next
    useEffect(() => {
        if (phase !== 'showing_result') return;
        if (countdown !== 0) return;
        if (isLoadingNext.current) return; // Prevent multiple calls

        // Check if game is finished
        if (currentRound >= totalRounds) {
            // FIX: Dùng setTimeout để tránh lỗi ESLint khi chuyển phase
            setTimeout(() => setPhase('finished'), 0);
            return;
        }

        // Load next question
        const loadNext = async () => {
            if (!roomId) return;

            isLoadingNext.current = true;

            try {
                const res = await fetch('/api/game/next', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    // FIX: Gửi thêm currentRound để backend tính toán đúng
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

                // Reset and show new question
                // QUAN TRỌNG: Đặt phase='loading' TRƯỚC để các useEffect không trigger sai
                setPhase('loading');
                
                // setQuestion đã tự reset isCorrect, correctAnswer, userAnswer nên KHÔNG cần resetGame()
                dispatch(setQuestionTime(data.questionTime || 30));
                dispatch(setQuestion(data.question));
                setCurrentRound(data.currentRound);
                setScore(data.score);
                
                // Đặt phase='playing' SAU khi đã set xong question
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

    // 6. Redirect when finished
    useEffect(() => {
        if (phase !== 'finished' || !roomId) return;

        const timer = setTimeout(() => {
            router.push(`/result?roomId=${roomId}`);
        }, 1500);

        return () => clearTimeout(timer);
    }, [phase, roomId, router]);

    // --- Render ---

    if (phase === 'loading') {
        return (
            <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                    <span>Đang tải câu hỏi...</span>
                </div>
            </main>
        );
    }

    if (phase === 'error') {
        return (
            <main className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
                    <h2 className="text-xl font-bold text-red-600">Lỗi</h2>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto whitespace-pre-wrap">
            {error}
          </pre>
                    <div className="text-xs text-gray-500">
                        <p>roomId: {roomId ?? 'null'}</p>
                        <p>round: {currentRound}/{totalRounds}</p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </main>
        );
    }

    if (phase === 'finished') {
        return (
            <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-green-600">Hoàn thành!</h2>
                    <p className="text-xl">Điểm của bạn: {score}</p>
                    <div className="animate-pulse">Đang chuyển đến kết quả...</div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 gap-4">
            <div className="flex items-center justify-between w-full max-w-lg">
                <Badge variant="outline" className="text-lg">
                    Câu {currentRound}/{totalRounds}
                </Badge>
                <Badge variant="secondary" className="text-lg">
                    {score} điểm
                </Badge>
            </div>

            <CountdownTimer />

            <QuestionDisplay roomId={roomId} />

            {phase === 'showing_result' && countdown > 0 && (
                <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                        Câu tiếp theo trong <span className="font-bold text-blue-600">{countdown}s</span>
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