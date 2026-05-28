import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { project_id, title, text = '', priority = 2, due_date = '', assigned_to } = body

  if (!project_id || !title) {
    throw createError({ statusCode: 400, message: 'project_id and title are required' })
  }

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO tasks (project_id, title, text, priority, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(project_id, title, text, priority, due_date, user.userId)

  if (assigned_to) {
    db.prepare('INSERT INTO task_users (user_id, task_id) VALUES (?, ?)').run(assigned_to, result.lastInsertRowid)
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid)
  return { task }
})
