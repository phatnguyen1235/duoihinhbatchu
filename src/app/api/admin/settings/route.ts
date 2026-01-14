import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Get current settings
export async function GET() {
  try {
    let settings = await prisma.gameSettings.findFirst();
    
    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.gameSettings.create({
        data: {
          questionTime: 30,
          waitingTime: 60,
          totalRounds: 5,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get Settings Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy cài đặt' },
      { status: 500 }
    );
  }
}

// Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionTime, waitingTime, totalRounds } = body;

    let settings = await prisma.gameSettings.findFirst();

    if (!settings) {
      settings = await prisma.gameSettings.create({
        data: {
          questionTime: questionTime || 30,
          waitingTime: waitingTime || 60,
          totalRounds: totalRounds || 5,
        },
      });
    } else {
      settings = await prisma.gameSettings.update({
        where: { id: settings.id },
        data: {
          ...(questionTime !== undefined && { questionTime }),
          ...(waitingTime !== undefined && { waitingTime }),
          ...(totalRounds !== undefined && { totalRounds }),
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update Settings Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật cài đặt' },
      { status: 500 }
    );
  }
}
