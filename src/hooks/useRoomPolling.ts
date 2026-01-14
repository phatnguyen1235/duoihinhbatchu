'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRoom, setPlayers } from '@/store/slices/roomSlice';

export function useRoomPolling(roomId: string | null, interval = 2000) {
  const dispatch = useAppDispatch();
  const room = useAppSelector((state) => state.room.current);

  useEffect(() => {
    if (!roomId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          dispatch(setRoom(data.room));
          dispatch(setPlayers(data.players));
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
    const timer = setInterval(poll, interval);

    return () => clearInterval(timer);
  }, [roomId, interval, dispatch]);

  return room;
}
