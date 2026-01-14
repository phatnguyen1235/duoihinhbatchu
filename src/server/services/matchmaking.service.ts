import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

const ROOM_SIZE = 5;

export class MatchmakingService {
  async joinRoom(qrCodeId: string) {
    return prisma.$transaction(async (tx) => {
      const existingPlayer = await tx.roomPlayer.findFirst({
        where: {
          qrCodeId,
          room: { status: { in: ['WAITING', 'STARTING', 'PLAYING'] } },
        },
        include: { room: { include: { players: true } } },
      });

      if (existingPlayer) {
        return {
          room: existingPlayer.room,
          isNew: false,
        };
      }

      const waitingRoom = await tx.room.findFirst({
        where: {
          status: 'WAITING',
        },
        include: {
          players: true,
          _count: { select: { players: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (waitingRoom && waitingRoom._count.players < ROOM_SIZE) {
        await tx.roomPlayer.create({
          data: { roomId: waitingRoom.id, qrCodeId },
        });

        const updatedRoom = await tx.room.findUnique({
          where: { id: waitingRoom.id },
          include: { players: { include: { qrCode: true } } },
        });

        if (updatedRoom!.players.length >= ROOM_SIZE) {
          await this.startRoom(tx as Prisma.TransactionClient, waitingRoom.id);
        }

        return { room: updatedRoom, isNew: false };
      }

      // Get settings for timeout
      const settings = await tx.gameSettings.findFirst();
      const waitingTime = (settings?.waitingTime || 60) * 1000;
      const totalRounds = settings?.totalRounds || 5;

      const newRoom = await tx.room.create({
        data: {
          timeoutAt: new Date(Date.now() + waitingTime),
          totalRounds: totalRounds,
          players: {
            create: { qrCodeId },
          },
        },
        include: { players: { include: { qrCode: true } } },
      });

      return { room: newRoom, isNew: true };
    });
  }

  async startRoom(tx: Prisma.TransactionClient, roomId: string) {
    try {
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { players: true },
      });

      if (!room || room.players.length === 0) return;

      const questions = await tx.question.findMany({
        where: { isActive: true },
      });

      console.log(`[Matchmaking] Found ${questions.length} active questions`);

      if (questions.length === 0) {
        console.error('[Matchmaking] No active questions found!');
        return;
      }

      // Get settings
      const settings = await tx.gameSettings.findFirst();
      const maxRounds = settings?.totalRounds || 5;

      const shuffled = this.shuffleArray([...questions]);
      const numPlayers = room.players.length;
      const roundCount = Math.min(maxRounds, Math.floor(questions.length / numPlayers) || 1);

      // Create assignments for all rounds for each player
      // Each player gets a DIFFERENT question in the same round
      const assignments: { roomPlayerId: string; questionId: string; roundNumber: number }[] = [];
      
      for (let round = 1; round <= roundCount; round++) {
        // Shuffle questions for each round to add more randomness
        const roundQuestions = this.shuffleArray([...shuffled]);
        
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

      console.log(`[Matchmaking] Creating ${assignments.length} assignments for ${numPlayers} players, ${roundCount} rounds`);

      await tx.questionAssignment.createMany({ data: assignments });

      await tx.room.update({
        where: { id: roomId },
        data: {
          status: 'PLAYING',
          currentRound: 1,
          totalRounds: roundCount,
          startedAt: new Date(),
        },
      });

      console.log(`[Matchmaking] Room ${roomId} started successfully`);
    } catch (error) {
      console.error('[Matchmaking] Error starting room:', error);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export const matchmakingService = new MatchmakingService();
