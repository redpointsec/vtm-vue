import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = event.context.params?.id
  const body = await readBody(event)

  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  const { title, text, priority, due_date } = body
  db.prepare(
    "UPDATE projects SET title=?, text=?, priority=?, due_date=?, updated_at=datetime('now') WHERE id=?"
  ).run(
    title ?? project.title,
    text ?? project.text,
    priority ?? project.priority,
    due_date ?? project.due_date,
    id
  )

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  return { project: updated }
})
