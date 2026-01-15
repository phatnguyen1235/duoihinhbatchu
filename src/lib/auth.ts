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
    if (typeof payload.qrCodeId === 'number') {
      return {
        qrCodeId: payload.qrCodeId,
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
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
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
