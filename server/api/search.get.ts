import { getQuery } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: SQL Injection — query parameter 'q' is interpolated directly into SQL
// VULN: No CSRF token validation (GET, but demonstrates the pattern)

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { q } = getQuery(event)

  if (!q) {
    return { tasks: [], projects: [] }
  }

  const db = getDb()

  // VULN: SQL Injection — raw template literal, no parameterization
  const tasks = db.prepare(`SELECT * FROM tasks WHERE title LIKE '%${q}%' OR text LIKE '%${q}%'`).all()
  const projects = db.prepare(`SELECT * FROM projects WHERE title LIKE '%${q}%' OR text LIKE '%${q}%'`).all()

  return { tasks, projects, query: q }
})
