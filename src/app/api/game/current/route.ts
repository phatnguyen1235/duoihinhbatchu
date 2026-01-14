import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // Find player's active room
    const roomPlayer = await prisma.roomPlayer.findFirst({
      where: {
        qrCodeId: auth.qrCodeId,
        room: { status: { in: ['WAITING', 'PLAYING'] } },
      },
      include: {
        room: true,
        assignments: {
          include: { question: true },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!roomPlayer) {
      return NextResponse.json({ error: 'Không tìm thấy game' }, { status: 404 });
    }

    const room = roomPlayer.room;
    const currentAssignment = roomPlayer.assignments.find(
      a => a.roundNumber === room.currentRound
    );

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    // Get settings
    const settings = await prisma.gameSettings.findFirst();
    const questionTime = settings?.questionTime || 30;

    // Check if game is finished
    const gameFinished = room.status === 'FINISHED' || 
      (currentAssignment.answeredAt && room.currentRound >= room.totalRounds);

    return NextResponse.json({
      roomId: room.id,
      question: {
        id: currentAssignment.question.id,
        imageUrl: currentAssignment.question.imageUrl,
        hint: currentAssignment.question.hint,
      },
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      questionTime,
      hasAnswered: !!currentAssignment.answeredAt,
      isCorrect: currentAssignment.isCorrect,
      score: roomPlayer.score,
      gameFinished,
    });
  } catch (error) {
    console.error('Get Current Game Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin game' },
      { status: 500 }
    );
  }
}
