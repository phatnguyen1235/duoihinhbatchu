import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, verifyJWT } from '@/lib/auth';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-min-32-characters-long'
);

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const auth = await verifyAuth(request);
    
    // Get raw token info for debugging
    const token = request.cookies.get('auth-token')?.value;
    let tokenInfo = null;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        tokenInfo = {
          qrCodeId: payload.qrCodeId,
          qrCodeIdType: typeof payload.qrCodeId,
          iat: payload.iat,
          exp: payload.exp,
        };
      } catch (e) {
        tokenInfo = { error: e instanceof Error ? e.message : 'Invalid token' };
      }
    }
    
    // Check database connection
    const qrCount = await prisma.qrCode.count();
    const questionCount = await prisma.question.count();
    const settingsCount = await prisma.gameSettings.count();
    const roomCount = await prisma.room.count();
    
    // Get recent QR codes
    const recentQrCodes = await prisma.qrCode.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, code: true, createdAt: true },
    });
    
    return NextResponse.json({
      status: 'ok',
      auth: auth ? { qrCodeId: auth.qrCodeId } : null,
      tokenInfo,
      database: {
        qrCodes: qrCount,
        questions: questionCount,
        settings: settingsCount,
        rooms: roomCount,
      },
      recentQrCodes,
      cookies: request.cookies.getAll().map(c => c.name),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
