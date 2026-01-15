'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { leaveRoom } from '@/store/slices/roomSlice';
import { resetGame } from '@/store/slices/gameSlice';
import { ResultCard } from '@/components/game/ResultCard';
import { Button } from '@/components/ui/button';

interface PlayerResult {
  rank: number;
  playerId: string;
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
      router.push('/qr-login');
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

  const handleBackToHome = () => {
    dispatch(leaveRoom());
    dispatch(resetGame());
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span>Đang tải kết quả...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={handleBackToHome}>Về trang chủ</Button>
        </div>
      </main>
    );
  }

  const currentUserResult = results.find((r) => r.isCurrentUser);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-2xl font-bold text-blue-600">Kết quả</h1>

      {currentUserResult && (
        <div className="text-center">
          <p className="text-lg">
            Bạn đứng{' '}
            <span className="font-bold text-2xl text-blue-600">
              #{currentUserResult.rank}
            </span>
          </p>
          <p className="text-3xl font-bold text-green-600">
            {currentUserResult.score} điểm
          </p>
          <p className="text-sm text-gray-500">
            Đúng {currentUserResult.correctCount}/{currentUserResult.totalRounds} câu
          </p>
        </div>
      )}

      <ResultCard results={results} />

      <Button onClick={handleBackToHome} size="lg">
        Về trang chủ
      </Button>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span>Đang tải...</span>
        </div>
      </main>
    }>
      <ResultContent />
    </Suspense>
  );
}
