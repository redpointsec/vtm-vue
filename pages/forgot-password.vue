<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-2xl p-8">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Forgot Password</h1>
        <p class="text-sm text-gray-500 mt-1">Enter your email to get a reset token</p>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{{ error }}</div>

      <div v-if="result" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm">
        <div class="text-green-700 font-medium">{{ result.message }}</div>
        <div v-if="result.reset_token" class="mt-2">
          <div class="text-gray-600">Reset token:</div>
          <code class="block bg-white border rounded p-2 mt-1 text-xs break-all">{{ result.reset_token }}</code>
          <NuxtLink :to="`/reset-password?token=${result.reset_token}`" class="text-violet-600 hover:underline text-xs mt-2 block">
            Go to reset page →
          </NuxtLink>
        </div>
      </div>

      <form v-if="!result" @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input v-model="email" type="email" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Enter your email" />
        </div>
        <button type="submit" :disabled="loading"
          class="w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
          {{ loading ? 'Sending...' : 'Send Reset Token' }}
        </button>
      </form>

      <div class="mt-4 text-center text-sm">
        <NuxtLink to="/login" class="text-violet-600 hover:underline">Back to login</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const email = ref('')
const error = ref('')
const result = ref<any>(null)
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    result.value = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })
  } catch (e: any) {
    error.value = e.data?.message || 'Request failed'
  } finally {
    loading.value = false
  }
}
</script>
