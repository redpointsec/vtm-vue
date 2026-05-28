import crypto from 'crypto'
import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'

// VULN: No CSRF token validation
// VULN: MD5 hashing on new password

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token, password } = body

  if (!token || !password) {
    throw createError({ statusCode: 400, message: 'Token and password are required' })
  }

  const db = getDb()

  const profile = db.prepare(
    'SELECT * FROM profiles WHERE reset_token = ? AND reset_token_expires > datetime(\'now\')'
  ).get(token) as any

  if (!profile) {
    throw createError({ statusCode: 400, message: 'Invalid or expired reset token' })
  }

  // VULN: Weak MD5 hashing — no salt
  const passwordHash = crypto.createHash('md5').update(password).digest('hex')

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, profile.user_id)
  db.prepare('UPDATE profiles SET reset_token = \'\', reset_token_expires = \'\' WHERE user_id = ?').run(profile.user_id)

  return { success: true, message: 'Password has been reset.' }
})
