import { execSync } from 'child_process'
import { readBody } from 'h3'
import { requireAuth } from '~/server/utils/auth'

// VULN: Command Injection — incomplete blacklist, many bypasses possible
// Blocked: semicolons, &&, ||, backticks — but $(), newlines, etc. still work
// VULN: No CSRF token validation

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const { host } = body

  if (!host) {
    throw createError({ statusCode: 400, message: 'Host is required' })
  }

  // VULN: Incomplete blacklist sanitization — only removes a few chars
  const sanitized = (host as string)
    .replace(/;/g, '')
    .replace(/&&/g, '')
    .replace(/\|\|/g, '')
    .replace(/`/g, '')

  let output = ''
  let error = ''

  try {
    // VULN: Command Injection — sanitized input still passed to shell
    output = execSync(`ping -c 1 ${sanitized}`, { timeout: 5000 }).toString()
  } catch (e: any) {
    error = e.message || 'Ping failed'
    output = e.stdout?.toString() || ''
  }

  return { host: sanitized, output, error }
})
