<template>
  <div class="p-8">
    <div v-if="pending" class="text-gray-500">Loading...</div>
    <div v-else-if="error" class="text-red-500">{{ error.message }}</div>
    <div v-else-if="pd">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <NuxtLink to="/projects" class="hover:text-violet-600">Projects</NuxtLink>
            <span>/</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">{{ pd.project?.title }}</h1>
          <div class="flex items-center gap-3 mt-2">
            <PriorityBadge :priority="pd.project?.priority" />
            <span class="text-sm text-gray-500">{{ pd.project?.completed_count }} / {{ pd.tasks?.length }} tasks completed</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="showEdit = true" class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Edit</button>
          <button @click="confirmDelete" class="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
        </div>
      </div>

      <!-- Description (v-html for XSS demo) -->
      <!-- VULN: XSS — project.text rendered as raw HTML via v-html -->
      <div v-if="pd.project?.text" class="bg-white border rounded-lg p-4 mb-6 prose prose-sm max-w-none" v-html="pd.project.text" />

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-white border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-gray-900">{{ pd.tasks?.length }}</div>
          <div class="text-xs text-gray-500">Total Tasks</div>
        </div>
        <div class="bg-white border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-amber-600">{{ pd.tasks?.filter((t: any) => t.status !== 'done').length }}</div>
          <div class="text-xs text-gray-500">Open</div>
        </div>
        <div class="bg-white border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-600">{{ pd.project?.completed_count }}</div>
          <div class="text-xs text-gray-500">Completed</div>
        </div>
      </div>

      <!-- Tasks Section -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold text-gray-800">Tasks</h2>
        <button @click="showAddTask = true" class="text-sm bg-violet-500 text-white px-3 py-1.5 rounded-lg hover:bg-violet-600">+ Add Task</button>
      </div>
      <div v-if="!pd.tasks?.length" class="text-gray-400 text-sm py-6 text-center">No tasks yet.</div>
      <div class="space-y-2 mb-6">
        <div v-for="task in pd.tasks" :key="task.id"
          class="bg-white border rounded-lg p-3 flex items-center justify-between hover:shadow-sm">
          <div class="flex items-center gap-3">
            <input type="checkbox" :checked="task.completed" @change="toggleTask(task)" class="rounded" />
            <NuxtLink :to="`/tasks/${task.id}`" class="text-sm font-medium hover:text-violet-600" :class="{ 'line-through text-gray-400': task.completed }">
              {{ task.title }}
            </NuxtLink>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge :status="task.status" />
            <PriorityBadge :priority="task.priority" />
          </div>
        </div>
      </div>

      <!-- File Upload -->
      <div class="bg-white border rounded-lg p-4 mb-6">
        <h3 class="font-semibold text-gray-800 mb-3">File Upload</h3>
        <!-- VULN: Unsafe file upload — any file type accepted -->
        <div class="flex gap-3">
          <input type="file" ref="fileInput" class="flex-1 text-sm border rounded px-2 py-1" />
          <button @click="uploadFile" class="px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600">Upload</button>
        </div>
        <div v-if="uploadMsg" class="text-sm mt-2" :class="uploadMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'">{{ uploadMsg }}</div>

        <h4 class="text-sm font-medium text-gray-700 mt-4 mb-2">Import from URL</h4>
        <div class="flex gap-3">
          <input v-model="importUrl" type="text" placeholder="http://internal-server/file" class="flex-1 text-sm border rounded px-2 py-1" />
          <button @click="importFile" class="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">Import</button>
        </div>
        <div v-if="importMsg" class="text-sm mt-2" :class="importMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'">{{ importMsg }}</div>
      </div>

      <!-- Files -->
      <div v-if="pd.files?.length > 0">
        <h3 class="font-semibold text-gray-800 mb-2">Attachments</h3>
        <div class="space-y-1">
          <div v-for="f in pd.files" :key="f.id" class="flex items-center gap-3 text-sm bg-white border rounded p-2">
            <a :href="f.path" target="_blank" class="text-violet-600 hover:underline flex-1">{{ f.name }}</a>
            <span class="text-xs text-gray-400">{{ f.uploaded_by_username }}</span>
          </div>
        </div>
      </div>

      <!-- Members -->
      <div v-if="pd.members?.length > 0" class="mt-4">
        <h3 class="font-semibold text-gray-800 mb-2">Members</h3>
        <div class="flex flex-wrap gap-2">
          <span v-for="m in pd.members" :key="m.id" class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
            {{ m.username }} <span class="text-gray-400">({{ m.role }})</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div v-if="showAddTask" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <h2 class="text-lg font-bold mb-4">Add Task</h2>
        <form @submit.prevent="addTask" class="space-y-3">
          <input v-model="taskForm.title" required placeholder="Title" class="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea v-model="taskForm.text" placeholder="Description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm" />
          <select v-model="taskForm.priority" class="w-full border rounded-lg px-3 py-2 text-sm">
            <option :value="1">High</option>
            <option :value="2">Medium</option>
            <option :value="3">Low</option>
          </select>
          <div class="flex gap-3 justify-end">
            <button type="button" @click="showAddTask = false" class="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm bg-violet-500 text-white rounded-lg">Add</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Project Modal -->
    <div v-if="showEdit && pd" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <h2 class="text-lg font-bold mb-4">Edit Project</h2>
        <form @submit.prevent="saveEdit" class="space-y-3">
          <input v-model="editForm.title" required placeholder="Title" class="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea v-model="editForm.text" placeholder="Description" rows="3" class="w-full border rounded-lg px-3 py-2 text-sm" />
          <select v-model="editForm.priority" class="w-full border rounded-lg px-3 py-2 text-sm">
            <option :value="1">High</option>
            <option :value="2">Medium</option>
            <option :value="3">Low</option>
          </select>
          <input v-model="editForm.due_date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm" />
          <div class="flex gap-3 justify-end">
            <button type="button" @click="showEdit = false" class="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm bg-violet-500 text-white rounded-lg">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = route.params.id

const { data, pending, error, refresh } = await useFetch(`/api/projects/${id}`)
const pd = computed(() => data.value as any)

const showAddTask = ref(false)
const showEdit = ref(false)
const fileInput = ref<HTMLInputElement>()
const importUrl = ref('')
const uploadMsg = ref('')
const importMsg = ref('')

const taskForm = reactive({ title: '', text: '', priority: 2 })
const editForm = reactive({
  title: pd.value?.project?.title || '',
  text: pd.value?.project?.text || '',
  priority: pd.value?.project?.priority || 2,
  due_date: pd.value?.project?.due_date || '',
})

watch(pd, (d) => {
  if (d?.project) {
    editForm.title = d.project.title
    editForm.text = d.project.text
    editForm.priority = d.project.priority
    editForm.due_date = d.project.due_date
  }
})

async function addTask() {
  await $fetch('/api/tasks', { method: 'POST', body: { ...taskForm, project_id: id } })
  showAddTask.value = false
  Object.assign(taskForm, { title: '', text: '', priority: 2 })
  await refresh()
}

async function toggleTask(task: any) {
  await $fetch(`/api/tasks/${task.id}`, {
    method: 'PUT',
    body: { completed: task.completed ? 0 : 1, status: task.completed ? 'open' : 'done' },
  })
  await refresh()
}

async function saveEdit() {
  await $fetch(`/api/projects/${id}`, { method: 'PUT', body: { ...editForm } })
  showEdit.value = false
  await refresh()
}

async function confirmDelete() {
  if (confirm('Delete this project?')) {
    await $fetch(`/api/projects/${id}`, { method: 'DELETE' })
    navigateTo('/projects')
  }
}

async function uploadFile() {
  uploadMsg.value = ''
  const file = fileInput.value?.files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  fd.append('project_id', String(id))
  try {
    const res: any = await $fetch('/api/files/upload', { method: 'POST', body: fd })
    uploadMsg.value = `Uploaded: ${res.file.name}`
    await refresh()
  } catch (e: any) {
    uploadMsg.value = `Error: ${e.data?.message || 'Upload failed'}`
  }
}

async function importFile() {
  importMsg.value = ''
  try {
    const res: any = await $fetch('/api/files/import', {
      method: 'POST',
      body: { sourceUrl: importUrl.value, project_id: id },
    })
    importMsg.value = `Imported: ${res.file.name}`
    importUrl.value = ''
    await refresh()
  } catch (e: any) {
    importMsg.value = `Error: ${e.data?.message || 'Import failed'}`
  }
}
</script>
