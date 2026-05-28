import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'

// VULN: Weak JWT - hardcoded secret, long expiry, httpOnly: false
const JWT_SECRET = process.env.VTM_VUE_AUTH_SECRET || 'vtm-vue-default-training-secret'

export interface AuthUser {
  userId: number
  username: string
  isAdmin: boolean
}

export async function signToken(payload: AuthUser): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  // VULN: 365 day expiry
  return new SignJWT({ userId: payload.userId, username: payload.username, isAdmin: payload.isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('365d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      isAdmin: payload.isAdmin as boolean,
    }
  } catch {
    return null
  }
}

export async function setAuthCookie(event: H3Event, user: AuthUser) {
  const token = await signToken(user)
  // VULN: httpOnly: false (JS readable), secure: false
  setCookie(event, 'vtm_token', token, {
    httpOnly: false,
    secure: false,
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
  })
  return token
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, 'vtm_token')
}

export async function getAuthUser(event: H3Event): Promise<AuthUser | null> {
  const token = getCookie(event, 'vtm_token')
  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const user = await getAuthUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }
  return user
}
