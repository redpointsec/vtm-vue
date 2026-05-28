import { getQuery } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const { session_id } = getQuery(event)

  if (!session_id) {
    throw createError({ statusCode: 400, message: 'session_id is required' })
  }

  const db = getDb()
  const messages = db.prepare(
    "SELECT * FROM chat_messages WHERE session_id = ? AND role IN ('user','assistant') ORDER BY created_at ASC"
  ).all(session_id)

  return { messages }
})
