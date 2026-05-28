// Client-side auth middleware
// Reads the JWT from the cookie (non-httpOnly, so JS can access it)
// VULN: Cookie is httpOnly: false, allowing JS access

export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

  if (publicRoutes.includes(to.path)) {
    return
  }

  // On client side, check for cookie
  if (import.meta.client) {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('vtm_token='))
    if (!cookie) {
      return navigateTo('/login')
    }
  }
})
