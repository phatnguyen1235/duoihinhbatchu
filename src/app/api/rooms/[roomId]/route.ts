import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

async function startRoomIfNeeded(roomId: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });

    if (!room || room.status !== 'WAITING' || room.players.length === 0) return null;

    // Check if timeout reached
    if (room.timeoutAt && new Date() >= room.timeoutAt) {
      // Get settings
      const settings = await prisma.gameSettings.findFirst();
      const maxRounds = settings?.totalRounds || 5;

      // Get questions for all rounds
      const questions = await prisma.question.findMany({
        where: { isActive: true },
      });

      console.log(`[StartRoom] Found ${questions.length} active questions`);

      if (questions.length === 0) {
        console.error('[StartRoom] No active questions found!');
        return null;
      }

      // Shuffle questions
      const shuffled = [...questions].sort(() => Math.random() - 0.5);

      // Delete any existing assignments for this room's players (in case of retry)
      await prisma.questionAssignment.deleteMany({
        where: {
          roomPlayerId: {
            in: room.players.map(p => p.id)
          }
        }
      });

      // Create assignments for all rounds for each player
      // Each player gets a DIFFERENT question in the same round
      const assignments: { roomPlayerId: string; questionId: string; roundNumber: number }[] = [];
      
      const numPlayers = room.players.length;
      const roundCount = Math.min(maxRounds, Math.floor(questions.length / numPlayers) || 1);
      
      for (let round = 1; round <= roundCount; round++) {
        // Shuffle questions for each round to add more randomness
        const roundQuestions = [...shuffled].sort(() => Math.random() - 0.5);
        
        for (let playerIdx = 0; playerIdx < numPlayers; playerIdx++) {
          const player = room.players[playerIdx];
          // Each player gets a different question index for the same round
          const questionIndex = ((round - 1) * numPlayers + playerIdx) % shuffled.length;
          
          assignments.push({
            roomPlayerId: player.id,
            questionId: roundQuestions[questionIndex].id,
            roundNumber: round,
          });
        }
      }

      console.log(`[StartRoom] Creating ${assignments.length} assignments for ${numPlayers} players, ${roundCount} rounds`);

      await prisma.questionAssignment.createMany({ data: assignments });

      // Update room status - start at round 1
      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: {
          status: 'PLAYING',
          currentRound: 1,
          totalRounds: roundCount,
          startedAt: new Date(),
        },
        include: { players: true },
      });

      console.log(`[StartRoom] Room ${roomId} started successfully`);

      return updatedRoom;
    }

    return null;
  } catch (error) {
    console.error('[StartRoom] Error:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { roomId } = await params;

    // Try to auto-start if timeout reached
    await startRoomIfNeeded(roomId);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        players: {
          include: {
            qrCode: {
              select: { id: true, code: true },
            },
            assignments: {
              where: { roundNumber: { gte: 1 } },
              orderBy: { roundNumber: 'desc' },
              take: 1,
              include: {
                question: {
                  select: { id: true, imageUrl: true, hint: true },
                },
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Không tìm thấy phòng' }, { status: 404 });
    }

    const players = room.players.map((p, index) => ({
      id: p.id,
      qrCodeId: p.qrCodeId,
      score: p.score,
      isReady: p.isReady,
      playerNumber: index + 1,
      hasAnswered: p.assignments.some(a => a.roundNumber === room.currentRound && a.answeredAt),
    }));

    return NextResponse.json({
      room: {
        id: room.id,
        status: room.status,
        maxPlayers: room.maxPlayers,
        totalRounds: room.totalRounds,
        currentRound: room.currentRound,
        timeoutAt: room.timeoutAt,
        startedAt: room.startedAt,
      },
      players,
    });
  } catch (error) {
    console.error('Get Room Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin phòng' },
      { status: 500 }
    );
  }
}
