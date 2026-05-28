import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = event.context.params?.id
  const body = await readBody(event)

  const db = getDb()
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any
  if (!task) throw createError({ statusCode: 404, message: 'Task not found' })

  const { title, text, status, priority, due_date, completed } = body
  db.prepare(
    "UPDATE tasks SET title=?, text=?, status=?, priority=?, due_date=?, completed=?, updated_at=datetime('now') WHERE id=?"
  ).run(
    title ?? task.title,
    text ?? task.text,
    status ?? task.status,
    priority ?? task.priority,
    due_date ?? task.due_date,
    completed !== undefined ? completed : task.completed,
    id
  )

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  return { task: updated }
})
