<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Tasks</h1>
      <button @click="showCreate = true"
        class="bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        + New Task
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-4">
      <select v-model="statusFilter" class="border rounded-lg px-3 py-1.5 text-sm">
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <select v-model="priorityFilter" class="border rounded-lg px-3 py-1.5 text-sm">
        <option value="">All priorities</option>
        <option value="1">High</option>
        <option value="2">Medium</option>
        <option value="3">Low</option>
      </select>
    </div>

    <div v-if="pending" class="text-gray-500">Loading...</div>
    <div v-else-if="filteredTasks.length === 0" class="text-gray-400 text-center py-12">No tasks found.</div>
    <div v-else class="space-y-2">
      <div v-for="task in filteredTasks" :key="task.id"
        class="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-sm">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <input type="checkbox" :checked="task.completed" @change="toggleTask(task)" class="rounded shrink-0" />
          <div class="min-w-0">
            <NuxtLink :to="`/tasks/${task.id}`" class="font-medium text-gray-900 hover:text-violet-600 truncate block"
              :class="{ 'line-through text-gray-400': task.completed }">
              {{ task.title }}
            </NuxtLink>
            <div class="text-xs text-gray-500 truncate">{{ task.project_title }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <PriorityBadge :priority="task.priority" />
          <StatusBadge :status="task.status" />
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <h2 class="text-lg font-bold mb-4">New Task</h2>
        <form @submit.prevent="createTask" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Project *</label>
            <select v-model="form.project_id" required class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select project...</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>
          <input v-model="form.title" required placeholder="Title *" class="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea v-model="form.text" placeholder="Description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm" />
          <select v-model="form.priority" class="w-full border rounded-lg px-3 py-2 text-sm">
            <option :value="1">High</option>
            <option :value="2">Medium</option>
            <option :value="3">Low</option>
          </select>
          <input v-model="form.due_date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm" />
          <div v-if="createError" class="text-red-500 text-sm">{{ createError }}</div>
          <div class="flex gap-3 justify-end">
            <button type="button" @click="showCreate = false" class="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm bg-violet-500 text-white rounded-lg">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data, pending, refresh } = await useFetch('/api/tasks')
const { data: projectsData } = await useFetch('/api/projects')

const projects = computed(() => (projectsData.value as any)?.projects || [])

const statusFilter = ref('')
const priorityFilter = ref('')

const filteredTasks = computed(() => {
  let tasks = (data.value as any)?.tasks || []
  if (statusFilter.value) tasks = tasks.filter((t: any) => t.status === statusFilter.value)
  if (priorityFilter.value) tasks = tasks.filter((t: any) => String(t.priority) === priorityFilter.value)
  return tasks
})

const showCreate = ref(false)
const createError = ref('')
const form = reactive({ project_id: '', title: '', text: '', priority: 2, due_date: '' })

async function createTask() {
  createError.value = ''
  try {
    await $fetch('/api/tasks', { method: 'POST', body: { ...form } })
    showCreate.value = false
    Object.assign(form, { project_id: '', title: '', text: '', priority: 2, due_date: '' })
    await refresh()
  } catch (e: any) {
    createError.value = e.data?.message || 'Failed'
  }
}

async function toggleTask(task: any) {
  await $fetch(`/api/tasks/${task.id}`, {
    method: 'PUT',
    body: { completed: task.completed ? 0 : 1, status: task.completed ? 'open' : 'done' },
  })
  await refresh()
}
</script>
