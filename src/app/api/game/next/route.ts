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

        // [THÊM MỚI] Lấy round hiện tại từ Client gửi lên
        // Nếu client không gửi thì coi như là 0 (chưa chơi câu nào)
        const clientCurrentRound = Number(body.currentRound) || 0;

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

        // [SỬA LOGIC] Tính round tiếp theo dựa trên tiến độ CÁ NHÂN
        // Thay vì: const nextRound = room.currentRound + 1;
        const nextRound = clientCurrentRound + 1;

        // Check if game is finished for THIS PLAYER
        if (nextRound > room.totalRounds) {
            // [QUAN TRỌNG] Xóa đoạn update room status = FINISHED
            // Vì nếu update ở đây, người chơi nhanh nhất về đích sẽ làm đóng phòng luôn
            // những người còn lại chưa kịp chơi xong sẽ bị văng.

            // Chỉ return về kết quả cá nhân
            return NextResponse.json({
                gameFinished: true,
                score: roomPlayer.score,
            });
        }

        // [QUAN TRỌNG] XÓA ĐOẠN NÀY ĐI
        // await prisma.room.update({
        //   where: { id: roomId },
        //   data: { currentRound: nextRound },
        // });
        // Lý do: Không được cập nhật currentRound chung của cả phòng
        // Mỗi người tự quản lý round của mình.

        // Get next question
        // Tìm trong danh sách bài đã chia sẵn (assignments)
        const nextAssignment = roomPlayer.assignments.find(
            a => a.roundNumber === nextRound
        );

        if (!nextAssignment) {
            // Fallback: Nếu không tìm thấy assignment (lỗi data), cho finish luôn
            return NextResponse.json({
                gameFinished: true,
                score: roomPlayer.score,
            });
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