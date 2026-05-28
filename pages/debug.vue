<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Debug Panel</h1>
<div v-if="pending" class="text-gray-500">Loading...</div>
    <div v-else-if="data" class="space-y-6">
      <!-- Environment Variables -->
      <div class="bg-white border rounded-xl overflow-hidden">
        <div class="bg-gray-50 border-b px-4 py-3">
          <h2 class="font-semibold text-gray-800">Environment Variables</h2>
          <p class="text-xs text-gray-500 mt-0.5">{{ Object.keys(data.environment || {}).length }} variables</p>
        </div>
        <div class="p-4">
          <div class="space-y-1 max-h-80 overflow-y-auto">
            <div v-for="(value, key) in data.environment" :key="key"
              class="flex gap-3 text-xs font-mono py-1 border-b border-gray-50 last:border-0">
              <span class="text-violet-600 font-semibold shrink-0 w-48 truncate">{{ key }}</span>
              <span class="text-gray-700 break-all">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Request Headers -->
      <div class="bg-white border rounded-xl overflow-hidden">
        <div class="bg-gray-50 border-b px-4 py-3">
          <h2 class="font-semibold text-gray-800">Request Headers</h2>
        </div>
        <div class="p-4">
          <div class="space-y-1">
            <div v-for="(value, key) in data.headers" :key="key"
              class="flex gap-3 text-xs font-mono py-1 border-b border-gray-50 last:border-0">
              <span class="text-violet-600 font-semibold shrink-0 w-48 truncate">{{ key }}</span>
              <span class="text-gray-700 break-all">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Server Info -->
      <div class="bg-white border rounded-xl p-4">
        <h2 class="font-semibold text-gray-800 mb-3">Server Info</h2>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500">Node Version:</span> <span class="font-mono">{{ data.nodeVersion }}</span></div>
          <div><span class="text-gray-500">Platform:</span> <span class="font-mono">{{ data.platform }}</span></div>
          <div><span class="text-gray-500">CWD:</span> <span class="font-mono text-xs">{{ data.cwd }}</span></div>
          <div><span class="text-gray-500">Uptime:</span> <span class="font-mono">{{ Math.floor(data.uptime) }}s</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data, pending } = await useFetch('/api/debug')
</script>
