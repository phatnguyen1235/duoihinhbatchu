import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { matchmakingService } from '@/server/services/matchmaking.service';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const result = await matchmakingService.joinRoom(auth.qrCodeId);

    return NextResponse.json({
      room: result.room,
      isNew: result.isNew,
    });
  } catch (error) {
    console.error('Join Room Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tham gia phòng' },
      { status: 500 }
    );
  }
}
