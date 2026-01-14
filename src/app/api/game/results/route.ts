import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Thiếu roomId' }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        players: {
          include: {
            assignments: {
              include: { question: true },
              orderBy: { roundNumber: 'asc' },
            },
          },
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Không tìm thấy phòng' }, { status: 404 });
    }

    const results = room.players.map((player, index) => {
      // Count correct answers
      const correctCount = player.assignments.filter(a => a.isCorrect).length;
      const totalAnswered = player.assignments.filter(a => a.answeredAt).length;
      
      return {
        rank: index + 1,
        playerId: player.id,
        qrCodeId: player.qrCodeId,
        score: player.score,
        correctCount,
        totalAnswered,
        totalRounds: room.totalRounds,
        isCurrentUser: player.qrCodeId === auth.qrCodeId,
        // Include all answers for detail view
        answers: player.assignments.map(a => ({
          round: a.roundNumber,
          isCorrect: a.isCorrect,
          userAnswer: a.userAnswer,
          correctAnswer: a.question.answer,
        })),
      };
    });

    return NextResponse.json({
      roomStatus: room.status,
      totalRounds: room.totalRounds,
      results,
    });
  } catch (error) {
    console.error('Get Results Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy kết quả' },
      { status: 500 }
    );
  }
}
