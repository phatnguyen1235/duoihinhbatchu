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
  const room = useAppSelector((state) => state.room.current);
  const { currentQuestion, isCorrect, timeRemaining } = useAppSelector((state) => state.game);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [waitingForNextRound, setWaitingForNextRound] = useState(false);
  const [showResultTime, setShowResultTime] = useState(0); // Countdown to show result

  const fetchQuestion = useCallback(async () => {
    if (!room?.id) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/game/question?roomId=${room.id}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Lỗi khi tải câu hỏi');
        return;
      }

      dispatch(setQuestionTime(data.questionTime || 30));
      dispatch(setQuestion(data.question));
      setCurrentRound(data.currentRound);
      setTotalRounds(data.totalRounds);
      setScore(data.score);
      
      if (data.hasAnswered) {
        // Already answered this round, check for game status
        const roomRes = await fetch(`/api/rooms/${room.id}`, {
          credentials: 'include',
        });
        const roomData = await roomRes.json();
        if (roomData.room.status === 'FINISHED') {
          setGameFinished(true);
        }
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, [room?.id, dispatch]);

  useEffect(() => {
    if (!room?.id) {
      router.push('/lobby');
      return;
    }

    fetchQuestion();
  }, [room?.id, fetchQuestion, router]);

  // Auto-submit when time runs out
  const autoSubmitAnswer = useCallback(async () => {
    if (!room?.id || isCorrect !== null) return;
    
    try {
      const res = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId: room.id,
          answerText: '', // Empty answer - timeout
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
  }, [room?.id, isCorrect, dispatch]);

  // Watch for timeout
  useEffect(() => {
    if (timeRemaining === 0 && isCorrect === null && currentQuestion) {
      autoSubmitAnswer();
    }
  }, [timeRemaining, isCorrect, currentQuestion, autoSubmitAnswer]);

  // Start countdown when player answers
  useEffect(() => {
    if (isCorrect !== null && !waitingForNextRound) {
      setShowResultTime(5); // Show result for 5 seconds
      setWaitingForNextRound(true);
    }
  }, [isCorrect, waitingForNextRound]);

  // Countdown timer for showing result
  useEffect(() => {
    if (showResultTime <= 0) return;

    const timer = setInterval(() => {
      setShowResultTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showResultTime]);

  // Poll for round changes when waiting for other players (only after countdown ends)
  useEffect(() => {
    if (!room?.id || gameFinished) return;
    if (waitingForNextRound && showResultTime > 0) return; // Wait for countdown

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/game/question?roomId=${room.id}`, {
          credentials: 'include',
        });
        const data = await res.json();
        
        if (res.ok) {
          // Check if round changed
          if (data.currentRound !== currentRound && !data.hasAnswered) {
            dispatch(resetGame());
            dispatch(setQuestionTime(data.questionTime || 30));
            dispatch(setQuestion(data.question));
            setCurrentRound(data.currentRound);
            setScore(data.score);
            setWaitingForNextRound(false);
            setShowResultTime(0);
          }
          
          // Check if game finished
          const roomRes = await fetch(`/api/rooms/${room.id}`, {
            credentials: 'include',
          });
          const roomData = await roomRes.json();
          if (roomData.room.status === 'FINISHED') {
            setGameFinished(true);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [room?.id, currentRound, dispatch, gameFinished, waitingForNextRound, showResultTime]);

  // Redirect to result when game finished
  useEffect(() => {
    if (gameFinished) {
      const timer = setTimeout(() => {
        router.push('/result');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameFinished, router]);

  if (loading) {
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
            onClick={() => router.push('/lobby')}
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
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-bold text-green-600">Hoàn thành!</h1>
          <p className="text-xl">Tổng điểm: <span className="font-bold text-blue-600">{score}</span></p>
          <p className="text-sm text-gray-500 animate-pulse">Đang chuyển đến kết quả...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 gap-4">
      {/* Header with round info and score */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <Badge variant="outline" className="text-lg px-4 py-1">
          Câu {currentRound}/{totalRounds}
        </Badge>
        <Badge className="text-lg px-4 py-1 bg-green-500">
          Điểm: {score}
        </Badge>
      </div>

      <h1 className="text-2xl font-bold text-blue-600">Đoán ca dao tục ngữ</h1>

      {currentQuestion && <CountdownTimer isPaused={false} />}

      <QuestionDisplay />

      {isCorrect !== null && (
        <div className="text-center space-y-2">
          {showResultTime > 0 ? (
            <p className="text-sm text-gray-600">
              Xem kết quả trong <span className="font-bold text-blue-600">{showResultTime}s</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 animate-pulse">
              {currentRound < totalRounds 
                ? 'Đang chờ chuyển câu tiếp theo...' 
                : 'Chuyển đến kết quả...'}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
