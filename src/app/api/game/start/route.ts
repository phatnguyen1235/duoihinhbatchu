import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT, setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getVietnamTime(): Date {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

interface RawQuestion {
    id: number;
    usageCount: number;
    createdAt: Date;
}

export async function POST(request: NextRequest) {
    try {
        const settings = await prisma.gameSettings.findFirst();
        const totalRounds = settings?.totalRounds || 5;

        const result = await prisma.$transaction(async (tx) => {

            // 1. LẤY CÂU HỎI + RANDOM NGAY TRONG SQL
            const candidatesRaw = await tx.$queryRaw<RawQuestion[]>`
                SELECT id, usageCount, createdAt
                FROM Question
                WHERE isActive = 1
                ORDER BY usageCount ASC, RAND()
                    LIMIT 50
                FOR UPDATE
            `;

            const candidateIds = candidatesRaw.map(q => q.id);

            if (candidateIds.length === 0) {
                throw new Error('NO_QUESTIONS');
            }

            // Lấy chi tiết câu hỏi
            const questionsData = await tx.question.findMany({
                where: { id: { in: candidateIds } }
            });

            // Sắp xếp lại questionsData theo đúng thứ tự random của SQL
            const sortedQuestions = candidateIds.map(id =>
                questionsData.find(q => q.id === id)!
            ).filter(Boolean);

            // 👉 FIX: Tính toán roundCount ở đây
            const roundCount = Math.min(totalRounds, sortedQuestions.length);

            // 2. CẮT LẤY SỐ LƯỢNG CẦN THIẾT
            const selectedQuestions = sortedQuestions.slice(0, roundCount);

            // ... (Phần tạo Room, Player giữ nguyên) ...

            const player = await tx.qrCode.create({
                data: {
                    code: `player_${Date.now()}`,
                    maxPlays: 1,
                    playCount: 1,
                    isActive: true,
                    createdAt: getVietnamTime(),
                },
            });

            const room = await tx.room.create({
                data: {
                    status: 'PLAYING',
                    maxPlayers: 1,
                    totalRounds: roundCount,
                    currentRound: 1,
                    startedAt: getVietnamTime(),
                    createdAt: getVietnamTime(),
                },
            });

            const roomPlayer = await tx.roomPlayer.create({
                data: {
                    roomId: room.id,
                    qrCodeId: player.id,
                    joinedAt: getVietnamTime(),
                },
            });

            const assignments = selectedQuestions.map((q, index) => ({
                roomPlayerId: roomPlayer.id,
                questionId: q.id,
                roundNumber: index + 1,
            }));

            await tx.questionAssignment.createMany({ data: assignments });

            await tx.question.updateMany({
                where: { id: { in: selectedQuestions.map(q => q.id) } },
                data: { usageCount: { increment: 1 } },
            });

            return { room, player };
        }, {
            timeout: 10000,
        });

        const token = await signJWT({ qrCodeId: result.player.id });
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

    } catch (error: unknown) {
        console.error('Start Game Error:', error);
        if (error instanceof Error && error.message === 'NO_QUESTIONS') {
            return NextResponse.json({ error: 'Hết câu hỏi' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}