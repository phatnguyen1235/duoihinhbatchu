'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRoom, setPlayers, setJoining, setError } from '@/store/slices/roomSlice';
import { LobbyRoom } from '@/components/game/LobbyRoom';
import { Button } from '@/components/ui/button';

export default function LobbyPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { current: room, isJoining, error } = useAppSelector((state) => state.room);
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<number>(60);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate countdown from timeoutAt
  useEffect(() => {
    if (!room?.timeoutAt) return;

    const updateCountdown = () => {
      const timeoutAt = new Date(room.timeoutAt!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((timeoutAt - now) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [room?.timeoutAt]);

  useEffect(() => {
    if (!mounted) return;

    const joinRoom = async () => {
      dispatch(setJoining(true));

      try {
        const res = await fetch('/api/rooms/join', {
          method: 'POST',
          credentials: 'include',
        });

        const data = await res.json();

        if (!res.ok) {
          dispatch(setError(data.error || 'Lỗi khi tham gia phòng'));
          dispatch(setJoining(false));
          return;
        }

        dispatch(setRoom(data.room));
        dispatch(setPlayers(data.room?.players || []));
        dispatch(setJoining(false));
      } catch (err) {
        console.error('Join room error:', err);
        dispatch(setError('Lỗi kết nối'));
        dispatch(setJoining(false));
      }
    };

    joinRoom();
  }, [dispatch, mounted]);

  const pollRoom = useCallback(async () => {
    if (!room?.id) return;
    
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok) {
        dispatch(setRoom(data.room));
        dispatch(setPlayers(data.players));

        if (data.room.status === 'PLAYING') {
          router.push('/play');
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [room?.id, dispatch, router]);

  useEffect(() => {
    if (!room?.id) return;

    pollRoom();
    const timer = setInterval(pollRoom, 2000);

    return () => clearInterval(timer);
  }, [room?.id, pollRoom]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => router.push('/qr-login')}>Quay lại</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-2xl font-bold text-blue-600">Đuổi Hình Bắt Chữ</h1>

      {isJoining ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span>Đang tìm phòng...</span>
        </div>
      ) : (
        <>
          {/* Countdown Timer */}
          {room?.status === 'WAITING' && (
            <div className="text-center">
              <div className={`text-5xl font-bold font-mono ${countdown <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {countdown > 0 ? 'Game sẽ bắt đầu sau' : 'Đang bắt đầu...'}
              </p>
            </div>
          )}

          <LobbyRoom />
        </>
      )}

      <p className="text-sm text-gray-500">
        Game sẽ tự động bắt đầu khi đủ 5 người hoặc khi hết thời gian chờ
      </p>
    </main>
  );
}
