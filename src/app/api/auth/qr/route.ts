import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT, setAuthCookie } from '@/lib/auth';
import { gameService } from '@/server/services/game.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim();

    if (!code || code.length < 1) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mã tham gia' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await prisma.qrCode.findUnique({
      where: { code },
    });

    if (existingCode) {
      // Code already used
      return NextResponse.json(
        { error: 'Mã này đã được sử dụng' },
        { status: 403 }
      );
    }

    // Create new code
    const qrCode = await prisma.qrCode.create({
      data: {
        code,
        maxPlays: 1,
        playCount: 1,
        isActive: true,
      },
    });

    const token = await signJWT({ qrCodeId: qrCode.id });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        qrCodeId: qrCode.id,
        token,
        expiresAt,
      },
    });

    // Start game immediately
    const gameResult = await gameService.startGame(qrCode.id);

    const response = NextResponse.json({ 
      success: true,
      roomId: gameResult.room.id,
    });
    setAuthCookie(response, token, expiresAt);

    return response;
  } catch (error) {
    console.error('QR Auth Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Lỗi hệ thống';
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
