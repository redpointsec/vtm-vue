import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = getDb()

  const totalProjects = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count
  const openTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'done' AND completed = 0").get() as any).count
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count

  const recentTasks = db.prepare(`
    SELECT t.*, p.title as project_title
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
    ORDER BY t.created_at DESC
    LIMIT 5
  `).all()

  const recentProjects = db.prepare(`
    SELECT * FROM projects ORDER BY created_at DESC LIMIT 5
  `).all()

  return {
    stats: { totalProjects, openTasks, totalUsers },
    recentTasks,
    recentProjects,
    currentUser: { userId: user.userId, username: user.username, isAdmin: user.isAdmin },
  }
})
