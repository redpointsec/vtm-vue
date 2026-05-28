import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = event.context.params?.id
  const db = getDb()

  const task = db.prepare(`
    SELECT t.*, p.title as project_title, u.username as created_by_username
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u ON u.id = t.created_by
    WHERE t.id = ?
  `).get(id) as any

  if (!task) throw createError({ statusCode: 404, message: 'Task not found' })

  // VULN: Notes returned with raw HTML text — rendered via v-html in frontend (XSS)
  const notes = db.prepare(`
    SELECT n.*, u.username
    FROM notes n
    LEFT JOIN users u ON u.id = n.user_id
    WHERE n.task_id = ?
    ORDER BY n.created_at ASC
  `).all(id)

  const assignees = db.prepare(`
    SELECT u.id, u.username FROM task_users tu JOIN users u ON u.id = tu.user_id WHERE tu.task_id = ?
  `).all(id)

  const files = db.prepare(`
    SELECT f.*, u.username as uploaded_by_username
    FROM files f
    LEFT JOIN users u ON u.id = f.uploaded_by
    WHERE f.task_id = ?
    ORDER BY f.uploaded_at DESC
  `).all(id)

  return { task, notes, assignees, files }
})
