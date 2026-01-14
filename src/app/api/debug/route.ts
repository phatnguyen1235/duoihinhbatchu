import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const auth = await verifyAuth(request);
    
    // Check database connection
    const qrCount = await prisma.qrCode.count();
    const questionCount = await prisma.question.count();
    const settingsCount = await prisma.gameSettings.count();
    const roomCount = await prisma.room.count();
    
    return NextResponse.json({
      status: 'ok',
      auth: auth ? { qrCodeId: auth.qrCodeId } : null,
      database: {
        qrCodes: qrCount,
        questions: questionCount,
        settings: settingsCount,
        rooms: roomCount,
      },
      cookies: request.cookies.getAll().map(c => c.name),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
