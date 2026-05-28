import crypto from 'crypto'
import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'
import { setAuthCookie } from '~/server/utils/auth'

// VULN: No CSRF token validation
// VULN: MD5 password hashing (weak, no salt)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, email, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Username and password are required' })
  }

  const db = getDb()

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    throw createError({ statusCode: 409, message: 'Username already taken' })
  }

  // VULN: Weak MD5 hashing — no salt
  const passwordHash = crypto.createHash('md5').update(password).digest('hex')

  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  ).run(username, email || '', passwordHash)

  const userId = result.lastInsertRowid as number

  db.prepare('INSERT INTO profiles (user_id, first_name, last_name) VALUES (?, ?, ?)').run(userId, '', '')

  await setAuthCookie(event, { userId, username, isAdmin: false })

  return { success: true, user: { id: userId, username, isAdmin: false } }
})
