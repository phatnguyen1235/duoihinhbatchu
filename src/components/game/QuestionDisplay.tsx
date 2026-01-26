'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUserAnswer, setSubmitting, setResult } from '@/store/slices/gameSlice';

interface QuestionDisplayProps {
    roomId?: number | null;
    currentRound?: number;
}

export function QuestionDisplay({ roomId: propRoomId, currentRound }: QuestionDisplayProps) {
    const dispatch = useAppDispatch();
    const { currentQuestion, userAnswer, isCorrect, correctAnswer, isSubmitting, scoreGained } =
        useAppSelector((state) => state.game);
    const storeRoomId = useAppSelector((state) => state.room.current?.id);
    const roomId = propRoomId || storeRoomId;
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
                    roundNumber: currentRound,
                }),
            });

            const data = await res.json();

            dispatch(
                setResult({
                    isCorrect: data.isCorrect ?? false,
                    correctAnswer: data.correctAnswer,
                    scoreGained: data.scoreGained ?? 0,
                })
            );
        } catch (error) {
            console.error('Submit error:', error);
            dispatch(setSubmitting(false));
        }
    };

    if (!currentQuestion) {
        return (
            <Card className="w-full max-w-2xl mx-auto bg-white/90 border-4 border-yellow-400 shadow-xl">
                <CardContent className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full" />
                        <p className="text-red-600 font-bold animate-pulse">Đang tải hình ảnh...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto bg-white/95 border-4 border-yellow-400 shadow-2xl overflow-hidden">
            <CardContent className="p-4 md:p-6 space-y-6">

                {/* Khung ảnh: Thêm viền đỏ cho nổi */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border-2 border-red-200 shadow-inner">
                    <Image
                        src={currentQuestion.imageUrl}
                        alt="Câu hỏi"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Gợi ý */}
                {currentQuestion.hint && (
                    <div className="text-center py-2">
                        {showHint ? (
                            // Hiển thị nội dung gợi ý to rõ (text-xl -> text-2xl)
                            <div className="inline-block px-6 py-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl text-yellow-900 text-xl md:text-2xl font-bold animate-fadeIn shadow-sm">
                                <span className="mr-2">💡</span>
                                Gợi ý: <span className="text-red-600">{currentQuestion.hint}</span>
                            </div>
                        ) : (
                            // Nút xem gợi ý to hơn (h-12, text-lg)
                            <Button
                                variant="ghost"
                                size="lg" // Size lớn
                                onClick={() => setShowHint(true)}
                                className="text-gray-500 hover:text-yellow-700 hover:bg-yellow-100 text-lg md:text-xl h-12 px-6 rounded-full border-2 border-transparent hover:border-yellow-200 transition-all"
                            >
                                🔍 Xem gợi ý
                            </Button>
                        )}
                    </div>
                )}

                {/* Khu vực Nhập liệu & Kết quả */}
                {isCorrect === null ? (
                    <div className="flex gap-3 items-stretch">
                        {/* 👇 Input Size Đại: h-14 (mobile) -> h-16 (tablet/pc) */}
                        <Input
                            placeholder="Nhập đáp án..."
                            value={userAnswer}
                            onChange={(e) => dispatch(setUserAnswer(e.target.value))}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            disabled={isSubmitting}
                            className="flex-1 h-14 md:h-16 text-lg md:text-2xl px-4 border-2 border-yellow-400 focus-visible:ring-red-500 focus-visible:border-red-500 placeholder:text-gray-400 rounded-xl shadow-sm"
                            autoFocus // Tự động focus để gõ luôn
                        />

                        {/* 👇 Nút Gửi Size Đại */}
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !userAnswer.trim()}
                            className="h-14 w-16 md:h-16 md:w-20 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all active:scale-95"
                        >
                            {isSubmitting ? (
                                <svg className="h-6 w-6 md:h-8 md:w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                // Icon Gửi to hơn
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 md:h-8 md:w-8">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            )}
                        </Button>
                    </div>
                ) : (
                    // Phần hiển thị Kết quả (To và Rõ hơn)
                    <div
                        className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 shadow-inner animate-in zoom-in duration-300 ${
                            isCorrect
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                    >
                        {isCorrect ? (
                            <>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <span className="font-bold text-2xl md:text-3xl">Chính xác!</span>
                                <span className="font-medium text-lg">+ {scoreGained} điểm</span>
                            </>
                        ) : (
                            <>
                                <div className="bg-red-100 p-3 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                </div>
                                <span className="font-bold text-2xl md:text-3xl">Sai rồi!</span>
                                {correctAnswer && (
                                    <div className="text-center mt-2">
                                        <p className="text-gray-600 text-sm mb-1">Đáp án đúng là:</p>
                                        <p className="text-xl md:text-2xl font-extrabold uppercase tracking-wide">{correctAnswer}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}