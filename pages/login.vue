<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-2xl p-8">
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span class="text-white font-bold text-lg">VTM</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Sign in</h1>
        <p class="text-sm text-gray-500 mt-1">Task Manager</p>
      </div>

      <!-- VULN: DOM XSS — ?msg= parameter written to DOM via innerHTML in onMounted -->
      <div id="flash-msg" class="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 hidden"></div>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            v-model="form.username"
            type="text"
            required
            autocomplete="username"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Enter username"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Enter password"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <div class="mt-6 text-center space-y-2 text-sm text-gray-500">
        <div>
          <NuxtLink to="/forgot-password" class="text-violet-600 hover:underline">Forgot password?</NuxtLink>
        </div>
        <div>
          Don't have an account?
          <NuxtLink to="/register" class="text-violet-600 hover:underline">Register</NuxtLink>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const form = reactive({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

onMounted(() => {
  const msg = route.query.msg as string
  if (msg) {
    const el = document.getElementById('flash-msg')
    if (el) {
      // VULN: DOM XSS — URL parameter written directly to innerHTML without sanitization
      el.innerHTML = msg
      el.classList.remove('hidden')
    }
  }
})

// VULN: next param taken from URL — open redirect
const nextUrl = computed(() => route.query.next as string || '/dashboard')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    // VULN: Open Redirect — passes next URL to server which accepts absolute URLs
    const res = await $fetch<any>('/api/auth/login', {
      method: 'POST',
      body: { ...form, next: nextUrl.value },
    })
    // VULN: Open Redirect — redirect may be an absolute URL (e.g. https://evil.com)
    window.location.href = res.redirect
  } catch (e: any) {
    error.value = e.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
