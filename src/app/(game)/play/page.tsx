'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [roomId, setRoomId] = useState<number | null>(null);
  const [showingResult, setShowingResult] = useState(false);
  const [resultCountdown, setResultCountdown] = useState(0);
  
  // Refs to prevent race conditions
  const isLoadingNextRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Fetch current game on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    const fetchGame = async () => {
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
          setError(`Lỗi: ${data.error || 'Không thể tải game'}`);
          return;
        }

        if (!data.question) {
          setError('Không có câu hỏi');
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
        setError(`Lỗi kết nối: ${err instanceof Error ? err.message : 'Unknown'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [dispatch, router]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && isCorrect === null && currentQuestion && roomId) {
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
    }
  }, [timeRemaining, isCorrect, currentQuestion, roomId, dispatch]);

  // When answer is submitted, start result countdown
  useEffect(() => {
    if (isCorrect !== null && !showingResult) {
      setShowingResult(true);
      setResultCountdown(3);
    }
  }, [isCorrect, showingResult]);

  // Result countdown timer
  useEffect(() => {
    if (resultCountdown <= 0) return;

    const timer = setTimeout(() => {
      setResultCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resultCountdown]);

  // When countdown ends, load next question
  useEffect(() => {
    if (resultCountdown === 0 && showingResult && !isLoadingNextRef.current) {
      if (currentRound >= totalRounds) {
        setGameFinished(true);
      } else {
        loadNextQuestion();
      }
    }
  }, [resultCountdown, showingResult, currentRound, totalRounds]);

  const loadNextQuestion = async () => {
    if (!roomId || isLoadingNextRef.current) return;
    
    isLoadingNextRef.current = true;
    
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

      // Reset game state for new question
      dispatch(resetGame());
      dispatch(setQuestionTime(data.questionTime || 30));
      dispatch(setQuestion(data.question));
      setCurrentRound(data.currentRound);
      setScore(data.score);
      setShowingResult(false);
      setResultCountdown(0);
    } catch (err) {
      setError(`Lỗi: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      isLoadingNextRef.current = false;
    }
  };

  // Redirect to result when game finished
  useEffect(() => {
    if (gameFinished && roomId) {
      const timer = setTimeout(() => {
        router.push(`/result?roomId=${roomId}`);
      }, 1500);
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
          <h2 className="text-xl font-bold text-red-600">Loi</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto whitespace-pre-wrap">
            {error}
          </pre>
          <div className="text-xs text-gray-500">
            <p>roomId: {roomId ?? 'null'}</p>
            <p>round: {currentRound}/{totalRounds}</p>
          </div>
          <button 
            onClick={() => router.push('/qr-login')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Quay lai dang nhap
          </button>
        </div>
      </main>
    );
  }

  if (gameFinished) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-green-600">Hoan thanh!</h2>
          <p className="text-xl">Diem cua ban: {score}</p>
          <div className="animate-pulse">Dang chuyen den ket qua...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 gap-4">
      <div className="flex items-center justify-between w-full max-w-lg">
        <Badge variant="outline" className="text-lg">
          Cau {currentRound}/{totalRounds}
        </Badge>
        <Badge variant="secondary" className="text-lg">
          {score} diem
        </Badge>
      </div>

      <CountdownTimer />

      <QuestionDisplay roomId={roomId} />

      {showingResult && resultCountdown > 0 && (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Cau tiep theo trong <span className="font-bold text-blue-600">{resultCountdown}s</span>
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
