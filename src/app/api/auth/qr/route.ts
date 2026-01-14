import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signJWT, setAuthCookie } from '@/lib/auth';
import { QrCodeSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    const parsed = QrCodeSchema.safeParse({ code });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Mã QR không hợp lệ' },
        { status: 400 }
      );
    }

    const qrCode = await prisma.qrCode.findUnique({
      where: { code: parsed.data.code },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: 'Không tìm thấy mã QR' },
        { status: 404 }
      );
    }

    if (!qrCode.isActive) {
      return NextResponse.json(
        { error: 'Mã QR đã bị vô hiệu hóa' },
        { status: 403 }
      );
    }

    if (qrCode.playCount >= qrCode.maxPlays) {
      return NextResponse.json(
        {
          error: 'Đã hết lượt chơi',
          playCount: qrCode.playCount,
          maxPlays: qrCode.maxPlays,
        },
        { status: 403 }
      );
    }

    const token = await signJWT({ qrCodeId: qrCode.id });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.qrCode.update({
        where: { id: qrCode.id },
        data: { playCount: { increment: 1 } },
      }),
      prisma.session.create({
        data: {
          qrCodeId: qrCode.id,
          token,
          expiresAt,
        },
      }),
    ]);

    const response = NextResponse.json({ success: true });
    setAuthCookie(response, token, expiresAt);

    return response;
  } catch (error) {
    console.error('QR Auth Error:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
