import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: SQL Injection — id parameter is interpolated directly into SQL subquery

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = event.context.params?.id

  const db = getDb()

  // VULN: SQL Injection — raw string interpolation of 'id' parameter
  const project = db.prepare(
    `SELECT *, (SELECT COUNT(*) FROM tasks WHERE project_id = ${id} AND completed = 1) as completed_count FROM projects WHERE id = ${id}`
  ).get() as any

  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  const tasks = db.prepare(`
    SELECT t.*, u.username as created_by_username
    FROM tasks t
    LEFT JOIN users u ON u.id = t.created_by
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(id)

  const members = db.prepare(`
    SELECT u.id, u.username, pu.role
    FROM project_users pu
    JOIN users u ON u.id = pu.user_id
    WHERE pu.project_id = ?
  `).all(id)

  const files = db.prepare(`
    SELECT f.*, u.username as uploaded_by_username
    FROM files f
    LEFT JOIN users u ON u.id = f.uploaded_by
    WHERE f.project_id = ?
    ORDER BY f.uploaded_at DESC
  `).all(id)

  return { project, tasks, members, files }
})
