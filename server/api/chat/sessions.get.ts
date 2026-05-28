import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = getDb()

  const sessions = db.prepare(
    'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(user.userId)

  return { sessions }
})
