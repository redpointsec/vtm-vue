import crypto from 'crypto'
import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: No CSRF token validation
// VULN: MD5 hashing (weak, no salt)

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, message: 'Current and new password required' })
  }

  const db = getDb()

  // VULN: MD5
  const currentHash = crypto.createHash('md5').update(currentPassword).digest('hex')
  const dbUser = db.prepare('SELECT * FROM users WHERE id = ? AND password_hash = ?').get(user.userId, currentHash) as any

  if (!dbUser) {
    throw createError({ statusCode: 401, message: 'Current password is incorrect' })
  }

  // VULN: MD5 no salt
  const newHash = crypto.createHash('md5').update(newPassword).digest('hex')
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.userId)

  return { success: true, message: 'Password changed successfully' }
})
