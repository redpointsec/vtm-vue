<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Projects</h1>
      <button @click="showCreate = true"
        class="bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        + New Project
      </button>
    </div>

    <div v-if="pending" class="text-gray-500">Loading...</div>
    <div v-else-if="projects.length === 0" class="text-gray-400 text-center py-12">No projects yet.</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <ProjectCard v-for="project in projects" :key="project.id" :project="project" />
    </div>

    <!-- Create Project Modal -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <h2 class="text-lg font-bold text-gray-900 mb-4">New Project</h2>
        <form @submit.prevent="createProject" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input v-model="form.title" required class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea v-model="form.text" rows="3" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select v-model="form.priority" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                <option :value="1">High</option>
                <option :value="2">Medium</option>
                <option :value="3">Low</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input v-model="form.due_date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          </div>
          <div v-if="createError" class="text-red-600 text-sm">{{ createError }}</div>
          <div class="flex gap-3 justify-end">
            <button type="button" @click="showCreate = false" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data, pending, refresh } = await useFetch('/api/projects')
const projects = computed(() => (data.value as any)?.projects ?? [])

const showCreate = ref(false)
const createError = ref('')
const form = reactive({ title: '', text: '', priority: 2, due_date: '' })

async function createProject() {
  createError.value = ''
  try {
    await $fetch('/api/projects', { method: 'POST', body: { ...form } })
    showCreate.value = false
    Object.assign(form, { title: '', text: '', priority: 2, due_date: '' })
    await refresh()
  } catch (e: any) {
    createError.value = e.data?.message || 'Failed to create project'
  }
}
</script>
