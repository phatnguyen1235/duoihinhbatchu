import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Get all QR codes
export async function GET() {
  try {
    const qrCodes = await prisma.qrCode.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        maxPlays: true,
        playCount: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ qrCodes });
  } catch (error) {
    console.error('Get QR Codes Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách mã' },
      { status: 500 }
    );
  }
}

// Create new QR code(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codes, maxPlays = 1 } = body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập ít nhất 1 mã' },
        { status: 400 }
      );
    }

    // Filter out empty codes and duplicates
    const uniqueCodes = [...new Set(codes.map((c: string) => c.trim()).filter((c: string) => c))];

    if (uniqueCodes.length === 0) {
      return NextResponse.json(
        { error: 'Không có mã hợp lệ' },
        { status: 400 }
      );
    }

    // Check for existing codes
    const existingCodes = await prisma.qrCode.findMany({
      where: { code: { in: uniqueCodes } },
      select: { code: true },
    });

    const existingCodeSet = new Set(existingCodes.map(c => c.code));
    const newCodes = uniqueCodes.filter(c => !existingCodeSet.has(c));

    if (newCodes.length === 0) {
      return NextResponse.json(
        { error: 'Tất cả mã đã tồn tại' },
        { status: 400 }
      );
    }

    // Create new codes
    await prisma.qrCode.createMany({
      data: newCodes.map(code => ({
        code,
        maxPlays,
        isActive: true,
      })),
    });

    return NextResponse.json({
      message: `Đã tạo ${newCodes.length} mã mới`,
      created: newCodes.length,
      skipped: uniqueCodes.length - newCodes.length,
    });
  } catch (error) {
    console.error('Create QR Codes Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo mã' },
      { status: 500 }
    );
  }
}

// Delete all QR codes (with option to keep active sessions)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      // Delete all sessions first
      await prisma.session.deleteMany({});
      // Then delete all QR codes
      const result = await prisma.qrCode.deleteMany({});
      return NextResponse.json({ 
        message: `Đã xóa ${result.count} mã`,
        deleted: result.count 
      });
    }

    // Only delete unused codes (playCount = 0)
    const result = await prisma.qrCode.deleteMany({
      where: { playCount: 0 },
    });

    return NextResponse.json({ 
      message: `Đã xóa ${result.count} mã chưa sử dụng`,
      deleted: result.count 
    });
  } catch (error) {
    console.error('Delete QR Codes Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa mã' },
      { status: 500 }
    );
  }
}
