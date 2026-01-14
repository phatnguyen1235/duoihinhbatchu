'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlayerResult {
  rank: number;
  playerId: string;
  score: number;
  correctCount: number;
  totalAnswered: number;
  totalRounds: number;
  isCurrentUser: boolean;
}

interface ResultCardProps {
  results: PlayerResult[];
}

export function ResultCard({ results }: ResultCardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          Bảng xếp hạng
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {results.map((player) => (
          <div
            key={player.playerId}
            className={`flex items-center justify-between p-3 rounded-lg ${
              player.isCurrentUser
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{getRankIcon(player.rank)}</span>
              <div>
                <div className="font-medium">
                  Player {player.playerId.slice(-4)}
                  {player.isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Bạn
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Đúng {player.correctCount}/{player.totalRounds} câu
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">
                {player.score} điểm
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
