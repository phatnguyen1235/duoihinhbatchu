import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-min-32-characters-long'
);

export interface JWTPayload {
  qrCodeId: number;
  iat?: number;
  exp?: number;
}

export async function signJWT(payload: { qrCodeId: number }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Handle both number and string (for backward compatibility)
    const qrCodeId = typeof payload.qrCodeId === 'number' 
      ? payload.qrCodeId 
      : typeof payload.qrCodeId === 'string' 
        ? parseInt(payload.qrCodeId, 10)
        : NaN;
    
    if (!isNaN(qrCodeId)) {
      return {
        qrCodeId,
        iat: payload.iat,
        exp: payload.exp,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyAuth(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export function setAuthCookie(response: NextResponse, token: string, expiresAt: Date) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export async function getAuthFromCookies(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyJWT(token);
}
