'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store/hooks';

export function LobbyRoom() {
  const { current: room, players } = useAppSelector((state) => state.room);
  const maxPlayers = 5;

  const statusText = {
    WAITING: 'Đang chờ...',
    STARTING: 'Sắp bắt đầu',
    PLAYING: 'Đang chơi',
    FINISHED: 'Đã kết thúc',
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Phòng chờ
        </CardTitle>
        <Badge variant={room?.status === 'WAITING' ? 'secondary' : 'default'}>
          {room ? statusText[room.status] : 'Đang tải...'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center text-sm text-gray-500">
          {players.length}/{maxPlayers} người chơi
        </div>

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: maxPlayers }).map((_, i) => {
            const player = players[i];
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <Avatar className={player ? 'ring-2 ring-blue-500' : 'opacity-30'}>
                  <AvatarFallback className={player ? 'bg-blue-100' : ''}>
                    {player ? `P${i + 1}` : '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">
                  {player ? `Player ${i + 1}` : 'Trống'}
                </span>
              </div>
            );
          })}
        </div>

        {room?.status === 'WAITING' && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Đang chờ người chơi khác...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
