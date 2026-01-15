import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT, setAuthCookie } from '@/lib/auth';

// Ép server không được cache để tránh lỗi lặp lại
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getVietnamTime(): Date {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

// Hàm tráo bài Fisher-Yates (Đưa hàm này quay lại)
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
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

            // 1. LẤY CÂU HỎI + KHÓA (LOCKING)
            // QUAN TRỌNG: Bỏ RAND() trong SQL để khóa ổn định.
            // Sắp xếp theo usageCount tăng dần để luôn lấy câu ít người chơi nhất.
            const candidatesRaw = await tx.$queryRaw<RawQuestion[]>`
                SELECT id, usageCount, createdAt
                FROM Question
                WHERE isActive = 1
                ORDER BY usageCount ASC, id ASC
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

            // 2. LOGIC TRÁO BÀI THÔNG MINH (Smart Shuffle)
            // Mục tiêu: Chỉ tráo những câu có usageCount thấp nhất để ưu tiên dùng chúng trước.

            // Bước A: Tìm mức usage thấp nhất trong đám vừa lấy về
            // (Vì SQL đã sort ASC nên phần tử đầu tiên luôn nhỏ nhất)
            // Chúng ta map lại questionsData theo thứ tự của candidatesRaw để đảm bảo đúng order
            const orderedQuestions = candidateIds.map(id =>
                questionsData.find(q => q.id === id)!
            ).filter(Boolean);

            const minUsage = orderedQuestions[0].usageCount;

            // Bước B: Tách thành 2 nhóm
            // Nhóm 1: Những câu "ngon nhất" (usageCount = minUsage)
            const bestCandidates = orderedQuestions.filter(q => q.usageCount === minUsage);
            // Nhóm 2: Những câu dự phòng (usageCount > minUsage)
            const otherCandidates = orderedQuestions.filter(q => q.usageCount > minUsage);

            // Bước C: Chỉ tráo ngẫu nhiên Nhóm 1
            const shuffledBest = shuffleArray(bestCandidates);

            // Bước D: Gộp lại (Ưu tiên Nhóm 1 đã tráo lên đầu)
            const finalPool = [...shuffledBest, ...otherCandidates];

            // 3. CẮT LẤY SỐ LƯỢNG CẦN THIẾT
            const roundCount = Math.min(totalRounds, finalPool.length);
            const selectedQuestions = finalPool.slice(0, roundCount);

            // ... (Phần còn lại giữ nguyên) ...

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