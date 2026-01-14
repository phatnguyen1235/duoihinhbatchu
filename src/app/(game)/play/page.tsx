'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setQuestion, setQuestionTime, resetGame, setResult } from '@/store/slices/gameSlice';
import { QuestionDisplay } from '@/components/game/QuestionDisplay';
import { CountdownTimer } from '@/components/game/CountdownTimer';
import { Badge } from '@/components/ui/badge';

export default function PlayPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentQuestion, isCorrect, timeRemaining } = useAppSelector((state) => state.game);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [showResultTime, setShowResultTime] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Fetch current game on mount
  const fetchCurrentGame = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/game/current', {
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/qr-login');
          return;
        }
        setError(data.error || 'Lỗi khi tải game');
        return;
      }

      setRoomId(data.roomId);
      dispatch(setQuestionTime(data.questionTime || 30));
      dispatch(setQuestion(data.question));
      setCurrentRound(data.currentRound);
      setTotalRounds(data.totalRounds);
      setScore(data.score);
      
      if (data.gameFinished) {
        setGameFinished(true);
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, [dispatch, router]);

  useEffect(() => {
    fetchCurrentGame();
  }, [fetchCurrentGame]);

  // Auto-submit when time runs out
  const autoSubmitAnswer = useCallback(async () => {
    if (!roomId || isCorrect !== null) return;
    
    try {
      const res = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId,
          answerText: '',
        }),
      });

      const data = await res.json();
      dispatch(
        setResult({
          isCorrect: false,
          correctAnswer: data.correctAnswer,
          scoreGained: 0,
        })
      );
    } catch (error) {
      console.error('Auto-submit error:', error);
    }
  }, [roomId, isCorrect, dispatch]);

  // Watch for timeout
  useEffect(() => {
    if (timeRemaining === 0 && isCorrect === null && currentQuestion) {
      autoSubmitAnswer();
    }
  }, [timeRemaining, isCorrect, currentQuestion, autoSubmitAnswer]);

  // Start countdown when player answers
  useEffect(() => {
    if (isCorrect !== null && showResultTime === 0) {
      setShowResultTime(3);
    }
  }, [isCorrect, showResultTime]);

  // Countdown timer for showing result, then load next question
  useEffect(() => {
    if (showResultTime <= 0) return;

    const timer = setInterval(() => {
      setShowResultTime((prev) => {
        if (prev <= 1) {
          // Move to next round or finish
          if (currentRound >= totalRounds) {
            setGameFinished(true);
          } else {
            // Load next question
            loadNextQuestion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResultTime, currentRound, totalRounds]);

  const loadNextQuestion = async () => {
    if (!roomId) return;
    
    dispatch(resetGame());
    setLoading(true);
    
    try {
      const res = await fetch('/api/game/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roomId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.gameFinished) {
          setGameFinished(true);
        } else {
          setError(data.error || 'Lỗi khi tải câu tiếp theo');
        }
        return;
      }

      dispatch(setQuestionTime(data.questionTime || 30));
      dispatch(setQuestion(data.question));
      setCurrentRound(data.currentRound);
      setScore(data.score);
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  // Redirect to result when game finished
  useEffect(() => {
    if (gameFinished && roomId) {
      const timer = setTimeout(() => {
        router.push(`/result?roomId=${roomId}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameFinished, roomId, router]);

  if (loading && !currentQuestion) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span>Đang tải câu hỏi...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => router.push('/qr-login')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Quay lại
          </button>
        </div>
      </main>
    );
  }

  if (gameFinished) {
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

      {isCorrect !== null && showResultTime > 0 && (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Câu tiếp theo trong <span className="font-bold text-blue-600">{showResultTime}s</span>
          </p>
        </div>
      )}
    </main>
  );
}
