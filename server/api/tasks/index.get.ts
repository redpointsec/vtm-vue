import { getQuery } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const { project_id } = getQuery(event)
  const db = getDb()

  let tasks
  if (project_id) {
    tasks = db.prepare(`
      SELECT t.*, p.title as project_title, u.username as created_by_username
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.created_by
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `).all(project_id)
  } else {
    tasks = db.prepare(`
      SELECT t.*, p.title as project_title, u.username as created_by_username
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.created_by
      ORDER BY t.created_at DESC
    `).all()
  }

  return { tasks }
})
