import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: No CSRF token validation
// VULN: Note text stored as-is (raw HTML), rendered with v-html on frontend (XSS)

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { task_id, title, text, image = '' } = body

  if (!task_id || !title) {
    throw createError({ statusCode: 400, message: 'task_id and title are required' })
  }

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO notes (task_id, user_id, title, text, image) VALUES (?, ?, ?, ?, ?)'
  ).run(task_id, user.userId, title, text || '', image)

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid)
  return { note }
})
