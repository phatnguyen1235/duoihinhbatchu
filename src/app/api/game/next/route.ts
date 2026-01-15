import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const roomId = Number(body.roomId);

    if (!roomId || isNaN(roomId)) {
      return NextResponse.json({ error: 'Thiếu roomId' }, { status: 400 });
    }

    // Find room and player
    const roomPlayer = await prisma.roomPlayer.findFirst({
      where: {
        roomId,
        qrCodeId: auth.qrCodeId,
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
    const nextRound = room.currentRound + 1;

    // Check if game is finished
    if (nextRound > room.totalRounds) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'FINISHED', endedAt: new Date() },
      });
      
      return NextResponse.json({ 
        gameFinished: true,
        score: roomPlayer.score,
      });
    }

    // Update room to next round
    await prisma.room.update({
      where: { id: roomId },
      data: { currentRound: nextRound },
    });

    // Get next question
    const nextAssignment = roomPlayer.assignments.find(
      a => a.roundNumber === nextRound
    );

    if (!nextAssignment) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi tiếp theo' }, { status: 404 });
    }

    // Get settings
    const settings = await prisma.gameSettings.findFirst();
    const questionTime = settings?.questionTime || 30;

    return NextResponse.json({
      question: {
        id: nextAssignment.question.id,
        imageUrl: nextAssignment.question.imageUrl,
        hint: nextAssignment.question.hint,
      },
      currentRound: nextRound,
      totalRounds: room.totalRounds,
      questionTime,
      score: roomPlayer.score,
    });
  } catch (error) {
    console.error('Next Question Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy câu hỏi tiếp theo' },
      { status: 500 }
    );
  }
}
