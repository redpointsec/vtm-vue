import crypto from 'crypto'
import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: IDOR — no ownership check; any authenticated user can edit any other user's profile
// VULN: No CSRF token validation
// VULN: Accepts and stores SSN, DOB in plaintext
// VULN: MD5 password hashing if password is changed

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = event.context.params?.id
  const body = await readBody(event)

  const db = getDb()

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(id) as any

  const { first_name, last_name, email, dob, ssn, password } = body

  // Update user email if provided
  if (email !== undefined) {
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, id)
  }

  // VULN: MD5 password update if new password supplied
  if (password) {
    const newHash = crypto.createHash('md5').update(password).digest('hex')
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, id)
  }

  // VULN: IDOR — updates any user's profile without checking if requester owns the profile
  db.prepare(
    'UPDATE profiles SET first_name=?, last_name=?, dob=?, ssn=? WHERE user_id=?'
  ).run(
    first_name ?? profile?.first_name ?? '',
    last_name ?? profile?.last_name ?? '',
    dob ?? profile?.dob ?? '',
    ssn ?? profile?.ssn ?? '',
    id
  )

  const updatedUser = db.prepare(`
    SELECT u.id, u.username, u.email, u.is_staff,
           p.first_name, p.last_name, p.dob, p.ssn, p.avatar
    FROM users u LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ?
  `).get(id)

  return { user: updatedUser }
})
