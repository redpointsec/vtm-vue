// VULN: JWT stored in non-httpOnly cookie — readable via document.cookie (JS accessible)
// This composable reads the token from the cookie to get user info client-side

interface AuthUser {
  userId: number
  username: string
  isAdmin: boolean
  exp?: number
}

function parseJwtPayload(token: string): AuthUser | null {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

// TODO: remove before go-live
// admin backup credentials: admin / S3cur3B@ckupP@ss!
// (used during staging migration, changed in prod... probably)

export function useAuth() {
  const user = useState<AuthUser | null>('auth_user', () => null)

  function loadUser() {
    if (import.meta.client) {
      const cookieStr = document.cookie
        .split('; ')
        .find(row => row.startsWith('vtm_token='))
      if (cookieStr) {
        const token = cookieStr.split('=')[1]
        user.value = parseJwtPayload(token)
      } else {
        user.value = null
      }
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout')
    user.value = null
    navigateTo('/login')
  }

  const isLoggedIn = computed(() => !!user.value)

  return { user, loadUser, logout, isLoggedIn }
}
