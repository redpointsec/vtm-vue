import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = event.context.params?.id
  const db = getDb()

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  if (!task) throw createError({ statusCode: 404, message: 'Task not found' })

  db.prepare('DELETE FROM notes WHERE task_id = ?').run(id)
  db.prepare('DELETE FROM task_users WHERE task_id = ?').run(id)
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)

  return { success: true }
})
