import { readMultipartFormData, getQuery } from 'h3'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { execSync } from 'child_process'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: Unsafe File Upload
//   - No file type validation (any extension accepted)
//   - Filename taken directly from user-supplied name or original filename
//   - Files stored in public/uploads/ (web-accessible)
//   - No CSRF token validation

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const filePart = formData.find(p => p.name === 'file')
  const suppliedNamePart = formData.find(p => p.name === 'name')
  const projectIdPart = formData.find(p => p.name === 'project_id')
  const taskIdPart = formData.find(p => p.name === 'task_id')

  if (!filePart) {
    throw createError({ statusCode: 400, message: 'No file field in form data' })
  }

  // VULN: Use supplier-provided filename or original filename — no sanitization
  const suppliedName = suppliedNamePart?.data?.toString()
  const originalName = filePart.filename || 'upload'
  const storedName = suppliedName || originalName

  const uploadsDir = path.resolve(process.cwd(), 'public/uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  // VULN: No extension check, no content-type validation
  // VULN: Command injection — storedName passed to shell without quoting or escaping
  const tmpPath = path.join(os.tmpdir(), `vtm-upload-${Date.now()}`)
  fs.writeFileSync(tmpPath, filePart.data)
  const destPath = path.join(uploadsDir, storedName)
  execSync(`mv ${tmpPath} ${destPath}`)

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO files (uploaded_by, project_id, task_id, name, path, content_type, size) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    user.userId,
    projectIdPart?.data?.toString() || query.project_id || null,
    taskIdPart?.data?.toString() || query.task_id || null,
    storedName,
    `/uploads/${storedName}`,
    filePart.type || 'application/octet-stream',
    filePart.data.length
  )

  return {
    success: true,
    file: {
      id: result.lastInsertRowid,
      name: storedName,
      path: `/uploads/${storedName}`,
      size: filePart.data.length,
    }
  }
})
