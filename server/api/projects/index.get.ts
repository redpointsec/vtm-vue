import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = getDb()

  const projects = db.prepare(`
    SELECT p.*,
      u.username as created_by_username,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND completed = 1) as completed_count
    FROM projects p
    LEFT JOIN users u ON u.id = p.created_by
    ORDER BY p.created_at DESC
  `).all()

  return { projects }
})
