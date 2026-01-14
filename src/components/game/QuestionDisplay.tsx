'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUserAnswer, setSubmitting, setResult } from '@/store/slices/gameSlice';

export function QuestionDisplay() {
  const dispatch = useAppDispatch();
  const { currentQuestion, userAnswer, isCorrect, correctAnswer, isSubmitting, scoreGained } =
    useAppSelector((state) => state.game);
  const roomId = useAppSelector((state) => state.room.current?.id);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async () => {
    if (!currentQuestion || !roomId || isSubmitting || !userAnswer.trim()) return;

    dispatch(setSubmitting(true));

    try {
      const res = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId,
          answerText: userAnswer,
        }),
      });

      const data = await res.json();
      dispatch(
        setResult({
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          scoreGained: data.scoreGained,
        })
      );
    } catch (error) {
      console.error('Submit error:', error);
      dispatch(setSubmitting(false));
    }
  };

  if (!currentQuestion) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="flex items-center justify-center h-64">
          <svg
            className="h-8 w-8 animate-spin text-gray-400"
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="p-6 space-y-6">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={currentQuestion.imageUrl}
            alt="Câu hỏi"
            fill
            className="object-contain"
            priority
          />
        </div>

        {currentQuestion.hint && (
          <div className="text-center">
            {showHint ? (
              <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                Gợi ý: {currentQuestion.hint}
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHint(true)}
              >
                Xem gợi ý
              </Button>
            )}
          </div>
        )}

        {isCorrect === null ? (
          <div className="flex gap-2">
            <Input
              placeholder="Nhập câu trả lời..."
              value={userAnswer}
              onChange={(e) => dispatch(setUserAnswer(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isSubmitting}
              className="flex-1"
            />
            <Button onClick={handleSubmit} disabled={isSubmitting || !userAnswer.trim()}>
              {isSubmitting ? (
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
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </Button>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center gap-2 p-4 rounded-lg ${
              isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {isCorrect ? (
              <>
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="font-medium">Chính xác! +{scoreGained} điểm</span>
              </>
            ) : (
              <>
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="font-medium">Sai rồi!</span>
                {correctAnswer && (
                  <span className="text-sm">Đáp án: {correctAnswer}</span>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
