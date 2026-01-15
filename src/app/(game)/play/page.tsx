'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setQuestion, setQuestionTime, resetGame, setResult } from '@/store/slices/gameSlice';
import { QuestionDisplay } from '@/components/game/QuestionDisplay';
import { CountdownTimer } from '@/components/game/CountdownTimer';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function PlayContent() {
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
  const [roomId, setRoomId] = useState<number | null>(null);

  // Fetch current game on mount
  const fetchCurrentGame = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/game/current', {
        credentials: 'include',
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError(`Invalid JSON response: ${text.substring(0, 200)}`);
        return;
      }

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/qr-login');
          return;
        }
        setError(`API Error (${res.status}): ${data.error || JSON.stringify(data)}`);
        return;
      }

      if (!data.question) {
        setError(`No question in response: ${JSON.stringify(data)}`);
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
    } catch (err) {
      const errMsg = err instanceof Error ? `${err.name}: ${err.message}` : 'Unknown error';
      setError(`fetchCurrentGame failed: ${errMsg}`);
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

  // Countdown timer for showing result
  useEffect(() => {
    if (showResultTime <= 0) return;

    const timer = setTimeout(() => {
      setShowResultTime((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showResultTime]);

  // When countdown reaches 0, move to next question
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  
  useEffect(() => {
    if (showResultTime === 0 && isCorrect !== null && !isLoadingNext && !gameFinished) {
      if (currentRound >= totalRounds) {
        setGameFinished(true);
      } else {
        loadNextQuestion();
      }
    }
  }, [showResultTime, isCorrect, currentRound, totalRounds, isLoadingNext, gameFinished]);

  const loadNextQuestion = async () => {
    if (!roomId || isLoadingNext) return;
    
    setIsLoadingNext(true);
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
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi kết nối';
      setError(`loadNextQuestion: ${errMsg}`);
    } finally {
      setLoading(false);
      setIsLoadingNext(false);
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
      <main className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
          <h2 className="text-xl font-bold text-red-600">Lỗi</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto whitespace-pre-wrap">
            {error}
          </pre>
          <div className="text-xs text-gray-500">
            <p>roomId: {roomId || 'null'}</p>
            <p>currentRound: {currentRound}</p>
            <p>hasQuestion: {currentQuestion ? 'yes' : 'no'}</p>
          </div>
          <button 
            onClick={() => router.push('/qr-login')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Quay lại đăng nhập
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

export default function PlayPage() {
  return (
    <ErrorBoundary>
      <PlayContent />
    </ErrorBoundary>
  );
}
