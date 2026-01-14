import { prisma } from '@/lib/db';

export class GameService {
  /**
   * Start a new game for a player immediately after scanning barcode
   * Questions are prioritized by usage count (less used = higher priority)
   */
  async startGame(qrCodeId: string) {
    // Get settings
    const settings = await prisma.gameSettings.findFirst();
    const totalRounds = settings?.totalRounds || 5;

    // Check if player already has an active game
    const existingPlayer = await prisma.roomPlayer.findFirst({
      where: {
        qrCodeId,
        room: { status: { in: ['WAITING', 'PLAYING'] } },
      },
      include: { 
        room: true,
        assignments: { include: { question: true } }
      },
    });

    if (existingPlayer) {
      return {
        room: existingPlayer.room,
        player: existingPlayer,
        isNew: false,
      };
    }

    // Get questions ordered by usage count (less used first)
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: [
        { usageCount: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    if (questions.length === 0) {
      throw new Error('Không có câu hỏi nào trong hệ thống');
    }

    const roundCount = Math.min(totalRounds, questions.length);

    // Select questions with lowest usage count
    const selectedQuestions = questions.slice(0, roundCount);

    // Create room and player in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create a room for this player (single player mode)
      const room = await tx.room.create({
        data: {
          status: 'PLAYING',
          maxPlayers: 1,
          totalRounds: roundCount,
          currentRound: 1,
          startedAt: new Date(),
        },
      });

      // Create player
      const player = await tx.roomPlayer.create({
        data: {
          roomId: room.id,
          qrCodeId,
        },
      });

      // Create assignments for all rounds
      const assignments = selectedQuestions.map((q, index) => ({
        roomPlayerId: player.id,
        questionId: q.id,
        roundNumber: index + 1,
      }));

      await tx.questionAssignment.createMany({ data: assignments });

      // Update usage count for selected questions
      await tx.question.updateMany({
        where: { id: { in: selectedQuestions.map(q => q.id) } },
        data: { usageCount: { increment: 1 } },
      });

      return { room, player };
    });

    return {
      room: result.room,
      player: result.player,
      isNew: true,
    };
  }
}

export const gameService = new GameService();
