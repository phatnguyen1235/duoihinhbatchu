import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT, setAuthCookie } from '@/lib/auth';

// --- 1. CẤU HÌNH SERVER ---
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getVietnamTime(): Date {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

// Hàm tráo bài Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

// 👉 FIX 1: Định nghĩa kiểu dữ liệu cho kết quả SQL Raw
interface RawQuestion {
    id: number; // <--- Đổi string thành number
    usageCount: number;
    createdAt: Date;
}

export async function POST(request: NextRequest) {
    try {
        const settings = await prisma.gameSettings.findFirst();
        const totalRounds = settings?.totalRounds || 5;

        // --- BẮT ĐẦU GIAO DỊCH (TRANSACTION) ---
        const result = await prisma.$transaction(async (tx) => {

            // 👉 FIX 2: Thay <any[]> bằng <RawQuestion[]>
            // Lúc này TypeScript sẽ hiểu kết quả trả về có .id, .usageCount...
            const candidatesRaw = await tx.$queryRaw<RawQuestion[]>`
                SELECT id, usageCount, createdAt
                FROM Question
                WHERE isActive = 1
                ORDER BY usageCount ASC, createdAt DESC
                    LIMIT 50
                FOR UPDATE
            `;

            const candidateIds = candidatesRaw.map(q => q.id);

            if (candidateIds.length === 0) {
                throw new Error('NO_QUESTIONS');
            }

            const candidateQuestions = await tx.question.findMany({
                where: { id: { in: candidateIds } }
            });

            // 2. Tráo bài (Shuffle)
            const shuffled = shuffleArray(candidateQuestions);

            // 3. Cắt lấy số lượng cần dùng
            const roundCount = Math.min(totalRounds, shuffled.length);
            const selectedQuestions = shuffled.slice(0, roundCount);

            // 4. Tạo dữ liệu người chơi & phòng
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

            // 5. Gán câu hỏi
            const assignments = selectedQuestions.map((q, index) => ({
                roomPlayerId: roomPlayer.id,
                questionId: q.id,
                roundNumber: index + 1,
            }));

            await tx.questionAssignment.createMany({ data: assignments });

            // 6. Cập nhật usageCount
            await tx.question.updateMany({
                where: { id: { in: selectedQuestions.map(q => q.id) } },
                data: { usageCount: { increment: 1 } },
            });

            return { room, player };
        }, {
            timeout: 10000,
        });

        // --- KẾT THÚC TRANSACTION ---

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

    } catch (error: unknown) { // 👉 FIX 3: Đổi 'any' thành 'unknown'
        console.error('Start Game Error:', error);

        // 👉 FIX 4: Kiểm tra kiểu an toàn trước khi truy cập .message
        if (error instanceof Error && error.message === 'NO_QUESTIONS') {
            return NextResponse.json(
                { error: 'Hết câu hỏi trong hệ thống' },
                { status: 400 }
            );
        }

        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';

        return NextResponse.json(
            { error: `Lỗi Server: ${errorMessage}` },
            { status: 500 }
        );
    }
}