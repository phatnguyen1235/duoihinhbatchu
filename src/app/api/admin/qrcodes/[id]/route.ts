import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Delete single QR code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete associated sessions first
    await prisma.session.deleteMany({
      where: { qrCodeId: id },
    });

    // Delete the QR code
    await prisma.qrCode.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Đã xóa mã' });
  } catch (error) {
    console.error('Delete QR Code Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa mã' },
      { status: 500 }
    );
  }
}

// Update QR code (reset play count, toggle active)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { resetPlayCount, isActive } = body;

    const updateData: { playCount?: number; isActive?: boolean } = {};

    if (resetPlayCount) {
      updateData.playCount = 0;
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    const updated = await prisma.qrCode.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ qrCode: updated });
  } catch (error) {
    console.error('Update QR Code Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật mã' },
      { status: 500 }
    );
  }
}
