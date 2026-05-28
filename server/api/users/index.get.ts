import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: No real admin enforcement — any authenticated user can see all users

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = getDb()

  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.is_staff, u.created_at,
           p.first_name, p.last_name, p.avatar, p.dob
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ORDER BY u.id ASC
  `).all()

  return { users }
})
