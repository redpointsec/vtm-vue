<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Search</h1>
<form @submit.prevent="doSearch" class="flex gap-3 mb-6">
      <input
        v-model="query"
        type="text"
        placeholder="Search tasks and projects..."
        class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
      />
      <button type="submit" :disabled="loading"
        class="px-6 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 disabled:opacity-50">
        Search
      </button>
    </form>

    <div v-if="error" class="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded p-3">
      <strong>Error:</strong> {{ error }}
    </div>

    <div v-if="results">
      <!-- VULN: Reflected XSS — query rendered as raw HTML via v-html -->
      <p class="text-sm text-gray-500 mb-4">Showing results for: <span v-html="query" /></p>
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">
          Tasks
          <span class="text-sm font-normal text-gray-500 ml-2">({{ results.tasks.length }} results)</span>
        </h2>
        <div v-if="results.tasks.length === 0" class="text-gray-400 text-sm">No tasks found.</div>
        <div v-else class="space-y-2">
          <div v-for="task in results.tasks" :key="task.id"
            class="bg-white border rounded-lg p-3 flex items-center justify-between">
            <NuxtLink :to="`/tasks/${task.id}`" class="font-medium text-gray-900 hover:text-violet-600">{{ task.title }}</NuxtLink>
            <div class="flex gap-2">
              <PriorityBadge :priority="task.priority" />
              <StatusBadge :status="task.status" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-3">
          Projects
          <span class="text-sm font-normal text-gray-500 ml-2">({{ results.projects.length }} results)</span>
        </h2>
        <div v-if="results.projects.length === 0" class="text-gray-400 text-sm">No projects found.</div>
        <div v-else class="space-y-2">
          <div v-for="project in results.projects" :key="project.id"
            class="bg-white border rounded-lg p-3 flex items-center justify-between">
            <NuxtLink :to="`/projects/${project.id}`" class="font-medium text-gray-900 hover:text-violet-600">{{ project.title }}</NuxtLink>
            <PriorityBadge :priority="project.priority" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading && searched" class="text-gray-400 text-center py-12">
      No results found for "{{ query }}"
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const query = ref('')
const results = ref<any>(null)
const loading = ref(false)
const error = ref('')
const searched = ref(false)

async function doSearch() {
  if (!query.value) return
  loading.value = true
  error.value = ''
  searched.value = true
  try {
    results.value = await $fetch(`/api/search?q=${encodeURIComponent(query.value)}`)
  } catch (e: any) {
    error.value = e.data?.message || String(e)
    results.value = null
  } finally {
    loading.value = false
  }
}
</script>
