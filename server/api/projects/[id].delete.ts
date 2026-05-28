import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = event.context.params?.id

  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  db.prepare('DELETE FROM tasks WHERE project_id = ?').run(id)
  db.prepare('DELETE FROM project_users WHERE project_id = ?').run(id)
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)

  return { success: true }
})
