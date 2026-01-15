import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT, setAuthCookie } from '@/lib/auth';

// --- 1. QUAN TRỌNG: ÉP SERVER KHÔNG ĐƯỢC CACHE ---
// Giúp mỗi lần bấm "Bắt đầu" là một lần tính toán mới hoàn toàn
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get Vietnam time (UTC+7)
function getVietnamTime(): Date {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

// --- 2. THUẬT TOÁN TRÁO BÀI CHUYÊN NGHIỆP (Fisher-Yates Shuffle) ---
// Tốt hơn nhiều so với .sort(() => 0.5 - Math.random())
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array]; // Copy mảng để không ảnh hưởng mảng gốc
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]]; // Hoán đổi vị trí
    }
    return newArr;
}

export async function POST(request: NextRequest) {
    try {
        // Get settings
        const settings = await prisma.gameSettings.findFirst();
        const totalRounds = settings?.totalRounds || 5;

        // 1. Lấy dư ra (ví dụ 50 câu) ưu tiên câu ít người chơi
        // Nếu 2 máy vào cùng lúc, bước này có thể trả về danh sách giống hệt nhau
        const candidateQuestions = await prisma.question.findMany({
            where: { isActive: true },
            orderBy: [
                { usageCount: 'asc' }, // Ưu tiên câu 'zin' hoặc ít dùng
                { createdAt: 'desc' }, // Nếu bằng nhau thì lấy mới nhất
            ],
            take: 50,
        });

        if (candidateQuestions.length === 0) {
            return NextResponse.json(
                { error: 'Không có câu hỏi nào trong hệ thống' },
                { status: 400 }
            );
        }

        // 2. Dùng Fisher-Yates để tráo
        // Kể cả danh sách đầu vào giống nhau, hàm này sẽ cho ra kết quả khác nhau trên mỗi Request
        const shuffled = shuffleArray(candidateQuestions);

        // 3. Cắt lấy đúng số lượng cần dùng
        const roundCount = Math.min(totalRounds, shuffled.length);
        const selectedQuestions = shuffled.slice(0, roundCount);

        // ------------------------------------------

        // Create everything in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create a simple player record
            const player = await tx.qrCode.create({
                data: {
                    code: `player_${Date.now()}`,
                    maxPlays: 1,
                    playCount: 1,
                    isActive: true,
                    createdAt: getVietnamTime(),
                },
            });

            // Create room
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

            // Create room player
            const roomPlayer = await tx.roomPlayer.create({
                data: {
                    roomId: room.id,
                    qrCodeId: player.id,
                    joinedAt: getVietnamTime(),
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