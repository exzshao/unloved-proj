import { SignJWT, jwtVerify } from 'jose';

const COOKIE = 's';

export async function setSession(responseHeaders: Headers, uid: number) {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error('APP_SECRET not set');
  const token = await new SignJWT({ uid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(secret));
  const cookie = `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
  responseHeaders.append('Set-Cookie', cookie);
}

export async function getSession(req: Request): Promise<number | null> {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error('APP_SECRET not set');
  const cookies = req.headers.get('cookie') || '';
  const match = cookies.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    const { payload } = await jwtVerify(match[1], new TextEncoder().encode(secret));
    return (payload as any).uid as number;
  } catch {
    return null;
  }
}
