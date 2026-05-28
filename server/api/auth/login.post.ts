import crypto from 'crypto'
import { readBody, getQuery, sendRedirect } from 'h3'
import { getDb } from '~/server/utils/db'
import { setAuthCookie } from '~/server/utils/auth'

// VULN: Sensitive Logging — logs plaintext password on failed login
// VULN: Open Redirect — redirects to user-supplied URL without validation
// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = getQuery(event)
  const { username, password } = body

  const db = getDb()

  // VULN: MD5 password hashing (weak, no salt)
  const passwordHash = crypto.createHash('md5').update(password || '').digest('hex')

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password_hash = ?').get(username, passwordHash) as any

  if (!user) {
    // VULN: Sensitive Logging — logs plaintext password
    console.warn(`VTM failed login username=${username} password=${password}`)
    throw createError({ statusCode: 401, message: 'Invalid username or password' })
  }

  await setAuthCookie(event, {
    userId: user.id,
    username: user.username,
    isAdmin: user.is_staff === 1,
  })

  // VULN: Open Redirect — accepts absolute URLs without validation
  const next = body.next || query.next || '/dashboard'

  return { success: true, redirect: next, user: { id: user.id, username: user.username, isAdmin: user.is_staff === 1 } }
})
