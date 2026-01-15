import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get settings
    const settings = await prisma.gameSettings.findFirst();
    const totalRounds = settings?.totalRounds || 5;

    // Get questions ordered by usage count (less used first)
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: [
        { usageCount: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Không có câu hỏi nào trong hệ thống' },
        { status: 400 }
      );
    }

    const roundCount = Math.min(totalRounds, questions.length);
    const selectedQuestions = questions.slice(0, roundCount);

    // Create everything in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create a simple player record (no QR code needed)
      const player = await tx.qrCode.create({
        data: {
          code: `player_${Date.now()}`,
          maxPlays: 1,
          playCount: 1,
          isActive: true,
        },
      });

      // Create room
      const room = await tx.room.create({
        data: {
          status: 'PLAYING',
          maxPlayers: 1,
          totalRounds: roundCount,
          currentRound: 1,
          startedAt: new Date(),
        },
      });

      // Create room player
      const roomPlayer = await tx.roomPlayer.create({
        data: {
          roomId: room.id,
          qrCodeId: player.id,
        },
      });

      // Create assignments
      const assignments = selectedQuestions.map((q, index) => ({
        roomPlayerId: roomPlayer.id,
        questionId: q.id,
        roundNumber: index + 1,
      }));

      await tx.questionAssignment.createMany({ data: assignments });

      // Update usage count
      await tx.question.updateMany({
        where: { id: { in: selectedQuestions.map(q => q.id) } },
        data: { usageCount: { increment: 1 } },
      });

      return { room, player };
    });

    // Create JWT token
    const token = await signJWT({ qrCodeId: result.player.id });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create session
    await prisma.session.create({
      data: {
        qrCodeId: result.player.id,
        token,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      success: true,
      roomId: result.room.id,
    });
    
    setAuthCookie(response, token, expiresAt);

    return response;
  } catch (error) {
    console.error('Start Game Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi bắt đầu game' },
      { status: 500 }
    );
  }
}
