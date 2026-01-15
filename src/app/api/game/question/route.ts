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
    const roomIdParam = searchParams.get('roomId');
    const roomId = Number(roomIdParam);

    if (!roomId || isNaN(roomId)) {
      return NextResponse.json({ error: 'Thiếu roomId' }, { status: 400 });
    }

    // Get room to know current round
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Không tìm thấy phòng' }, { status: 404 });
    }

    // Get game settings
    const settings = await prisma.gameSettings.findFirst();
    const questionTime = settings?.questionTime || 30;

    const roomPlayer = await prisma.roomPlayer.findFirst({
      where: {
        roomId,
        qrCodeId: auth.qrCodeId,
      },
      include: {
        assignments: {
          where: {
            roundNumber: room.currentRound,
          },
          include: {
            question: true,
          },
        },
      },
    });

    if (!roomPlayer) {
      return NextResponse.json({ error: 'Bạn không ở trong phòng này' }, { status: 403 });
    }

    const currentAssignment = roomPlayer.assignments[0];

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Chưa được phân câu hỏi' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Get Question Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy câu hỏi' },
      { status: 500 }
    );
  }
}
