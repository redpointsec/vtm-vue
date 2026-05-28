import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = event.context.params?.id
  const db = getDb()

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id)
  if (!note) throw createError({ statusCode: 404, message: 'Note not found' })

  db.prepare('DELETE FROM notes WHERE id = ?').run(id)
  return { success: true }
})
