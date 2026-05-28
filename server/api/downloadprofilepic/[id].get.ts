import { sendRedirect } from 'h3'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

// VULN: Unsafe redirect — redirects to the stored avatar URL without any validation.
// An attacker who sets their avatar to an arbitrary URL (including javascript: or
// an external site) can use this endpoint to bounce other users to that destination.

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = event.context.params?.id
  const db = getDb()

  const profile = db.prepare('SELECT avatar FROM profiles WHERE user_id = ?').get(id) as any

  const avatarUrl = profile?.avatar || '/default-avatar.png'

  // VULN: No validation — redirects to whatever URL is stored in the avatar field
  return sendRedirect(event, avatarUrl)
})
