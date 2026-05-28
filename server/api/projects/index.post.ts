import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { title, text = '', priority = 2, due_date = '' } = body

  if (!title) {
    throw createError({ statusCode: 400, message: 'Title is required' })
  }

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO projects (title, text, priority, due_date, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(title, text, priority, due_date, user.userId)

  db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (?, ?, ?)').run(user.userId, result.lastInsertRowid, 'manager')

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  return { project }
})
