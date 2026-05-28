<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-2xl p-8">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Reset Password</h1>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{{ error }}</div>
      <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
        Password reset! <NuxtLink to="/login" class="underline font-medium">Sign in</NuxtLink>
      </div>

      <form v-if="!success" @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Reset Token</label>
          <input v-model="token" type="text" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input v-model="password" type="password" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <button type="submit" :disabled="loading"
          class="w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const token = ref(route.query.token as string || '')
const password = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: password.value },
    })
    success.value = true
  } catch (e: any) {
    error.value = e.data?.message || 'Reset failed'
  } finally {
    loading.value = false
  }
}
</script>
