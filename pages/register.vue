<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-2xl p-8">
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span class="text-white font-bold text-lg">VTM</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Create Account</h1>
        <p class="text-sm text-gray-500 mt-1">Task Manager</p>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
        {{ error }}
      </div>
      <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
        Account created! Redirecting...
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input v-model="form.username" type="text" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="form.email" type="email"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input v-model="form.password" type="password" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <button type="submit" :disabled="loading"
          class="w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
          {{ loading ? 'Creating...' : 'Create Account' }}
        </button>
      </form>

      <div class="mt-4 text-center text-sm text-gray-500">
        Already have an account?
        <NuxtLink to="/login" class="text-violet-600 hover:underline">Sign in</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const form = reactive({ username: '', email: '', password: '' })
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: form })
    success.value = true
    setTimeout(() => navigateTo(`/login?msg=Account created for ${form.username}. Please sign in.`), 1000)
  } catch (e: any) {
    error.value = e.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>
