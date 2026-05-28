import crypto from 'crypto'
import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'

// VULN: SQL Injection — email parameter interpolated directly into SQL query
// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email) {
    throw createError({ statusCode: 400, message: 'Email is required' })
  }

  const db = getDb()

  // VULN: SQL Injection — raw string interpolation
  const user = db.prepare(
    `SELECT * FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.email = '${email}'`
  ).get() as any

  if (!user) {
    // Don't reveal whether email exists (but the SQL injection still works)
    return { success: true, message: 'If that email exists, a reset link has been sent.' }
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600000).toISOString() // 1 hour

  db.prepare('UPDATE profiles SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?')
    .run(resetToken, expires, user.user_id || user.id)

  // In a real app this would send an email; here we return the token for training purposes
  return {
    success: true,
    message: 'Password reset token generated.',
    reset_token: resetToken, // VULN: Exposing token in response
    debug: `Reset link: /reset-password?token=${resetToken}`,
  }
})
