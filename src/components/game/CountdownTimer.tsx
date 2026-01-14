'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { decrementTime } from '@/store/slices/gameSlice';

interface CountdownTimerProps {
  isPaused?: boolean;
}

export function CountdownTimer({ isPaused = false }: CountdownTimerProps) {
  const dispatch = useAppDispatch();
  const timeRemaining = useAppSelector((state) => state.game.timeRemaining);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      dispatch(decrementTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch, isPaused]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const isLowTime = timeRemaining <= 10;

  return (
    <div
      className={`text-center font-mono text-2xl font-bold ${
        isLowTime ? 'text-red-500 animate-pulse' : 'text-gray-700'
      }`}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
