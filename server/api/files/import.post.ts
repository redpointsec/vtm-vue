import { readBody } from 'h3'
import path from 'path'
import fs from 'fs'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: SSRF — no URL validation, fetches any URL including internal/file:// schemes
// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { sourceUrl, name, project_id, task_id } = body

  if (!sourceUrl) {
    throw createError({ statusCode: 400, message: 'sourceUrl is required' })
  }

  // VULN: SSRF — fetch any URL without validation (internal IPs, file://, etc.)
  let response: Response
  try {
    response = await fetch(sourceUrl)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: `Failed to fetch URL: ${e.message}` })
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const buffer = Buffer.from(await response.arrayBuffer())

  const uploadsDir = path.resolve(process.cwd(), 'public/uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  // Derive filename from URL or use supplied name
  const urlFilename = sourceUrl.split('/').pop()?.split('?')[0] || 'imported-file'
  const storedName = name || urlFilename

  const filePath = path.join(uploadsDir, storedName)
  fs.writeFileSync(filePath, buffer)

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO files (uploaded_by, project_id, task_id, name, path, source_url, content_type, size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(user.userId, project_id || null, task_id || null, storedName, `/uploads/${storedName}`, sourceUrl, contentType, buffer.length)

  return {
    success: true,
    file: {
      id: result.lastInsertRowid,
      name: storedName,
      path: `/uploads/${storedName}`,
      source_url: sourceUrl,
      size: buffer.length,
    }
  }
})
