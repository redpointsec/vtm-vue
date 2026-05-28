import { readBody } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = event.context.params?.id
  const body = await readBody(event)

  const db = getDb()
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as any
  if (!note) throw createError({ statusCode: 404, message: 'Note not found' })

  const { title, text, image } = body
  db.prepare(
    "UPDATE notes SET title=?, text=?, image=?, updated_at=datetime('now') WHERE id=?"
  ).run(
    title ?? note.title,
    text ?? note.text,
    image ?? note.image,
    id
  )

  const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(id)
  return { note: updated }
})
