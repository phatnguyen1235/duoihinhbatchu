import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { compareAnswers } from '@/lib/normalize';
import { AnswerSchema } from '@/lib/validators';

// Get Vietnam time (UTC+7)
function getVietnamTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AnswerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { roomId, answerText } = parsed.data;

    // Get room to know current round
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Không tìm thấy phòng' }, { status: 404 });
    }

    const roomPlayer = await prisma.roomPlayer.findFirst({
      where: {
        roomId,
        qrCodeId: auth.qrCodeId,
      },
      include: {
        assignments: {
          where: { roundNumber: room.currentRound },
          include: { question: true },
        },
      },
    });

    const currentAssignment = roomPlayer?.assignments[0];

    if (!currentAssignment) {
      return NextResponse.json(
        { error: 'Không tìm thấy câu hỏi' },
        { status: 404 }
      );
    }

    if (currentAssignment.answeredAt) {
      return NextResponse.json(
        { error: 'Đã trả lời rồi', isCorrect: currentAssignment.isCorrect },
        { status: 400 }
      );
    }

    const correctAnswer = currentAssignment.question.answer;
    const isCorrect = compareAnswers(answerText, correctAnswer, true);
    const scoreGained = isCorrect ? 10 : 0;

    await prisma.$transaction([
      prisma.questionAssignment.update({
        where: { id: currentAssignment.id },
        data: {
          userAnswer: answerText,
          isCorrect,
          answeredAt: getVietnamTime(),
        },
      }),
      prisma.roomPlayer.update({
        where: { id: roomPlayer!.id },
        data: { score: { increment: scoreGained } },
      }),
    ]);

    // Check if all players have answered current round
    const allPlayersCurrentRound = await prisma.roomPlayer.findMany({
      where: { roomId },
      include: {
        assignments: {
          where: { roundNumber: room.currentRound },
        },
      },
    });

    const allAnsweredCurrentRound = allPlayersCurrentRound.every(
      (p) => p.assignments[0]?.answeredAt
    );

    let nextRound = room.currentRound;
    let gameFinished = false;

    if (allAnsweredCurrentRound) {
      if (room.currentRound >= room.totalRounds) {
        // Game finished
        await prisma.room.update({
          where: { id: roomId },
          data: { status: 'FINISHED', endedAt: getVietnamTime() },
        });
        gameFinished = true;
      } else {
        // Move to next round
        nextRound = room.currentRound + 1;
        await prisma.room.update({
          where: { id: roomId },
          data: { currentRound: nextRound },
        });
      }
    }

    return NextResponse.json({
      isCorrect,
      scoreGained,
      correctAnswer,
      currentRound: room.currentRound,
      nextRound,
      totalRounds: room.totalRounds,
      allAnswered: allAnsweredCurrentRound,
      gameFinished,
    });
  } catch (error) {
    console.error('Answer Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi gửi câu trả lời' },
      { status: 500 }
    );
  }
}
