<template>
  <div class="p-8 max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Ping Utility</h1>
<div class="bg-white border rounded-xl p-6">
      <form @submit.prevent="doPing" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Hostname or IP</label>
          <input
            v-model="host"
            type="text"
            required
            placeholder="8.8.8.8"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <button type="submit" :disabled="loading"
          class="px-6 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 disabled:opacity-50">
          {{ loading ? 'Pinging...' : 'Ping' }}
        </button>
      </form>

      <div v-if="result" class="mt-6">
        <div class="text-sm font-medium text-gray-700 mb-2">Output:</div>
        <pre class="bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-auto max-h-80">{{ result.output || result.error }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const host = ref('8.8.8.8')
const loading = ref(false)
const result = ref<any>(null)

async function doPing() {
  loading.value = true
  result.value = null
  try {
    result.value = await $fetch('/api/ping', { method: 'POST', body: { host: host.value } })
  } catch (e: any) {
    result.value = { error: e.data?.message || 'Request failed' }
  } finally {
    loading.value = false
  }
}
</script>
