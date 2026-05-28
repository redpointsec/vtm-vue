<template>
  <div class="p-8">
    <div v-if="pending" class="text-gray-500">Loading...</div>
    <div v-else-if="fetchError" class="text-red-500">{{ fetchError.message }}</div>
    <div v-else-if="td">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <NuxtLink to="/tasks" class="hover:text-violet-600">Tasks</NuxtLink>
            <span>/</span>
            <NuxtLink :to="`/projects/${td.task.project_id}`" class="hover:text-violet-600">{{ td.task.project_title }}</NuxtLink>
            <span>/</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">{{ td.task.title }}</h1>
          <div class="flex items-center gap-3 mt-2">
            <PriorityBadge :priority="td.task.priority" />
            <StatusBadge :status="td.task.status" />
            <span class="text-sm text-gray-500">by {{ td.task.created_by_username }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="showEdit = true" class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Edit</button>
          <button @click="confirmDelete" class="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
        </div>
      </div>

      <!-- Task description -->
      <div v-if="td.task.text" class="bg-white border rounded-lg p-4 mb-6 text-sm text-gray-700">
        {{ td.task.text }}
      </div>

      <!-- Meta -->
      <div class="flex gap-4 mb-6 text-sm text-gray-500">
        <div v-if="td.task.due_date">Due: <span class="text-gray-700">{{ td.task.due_date }}</span></div>
        <div v-if="td.assignees?.length > 0">
          Assignees: <span v-for="a in td.assignees" :key="a.id" class="text-gray-700 mr-1">{{ a.username }}</span>
        </div>
      </div>

      <!-- Quick status change -->
      <div class="flex gap-2 mb-6">
        <span class="text-sm text-gray-600 self-center">Status:</span>
        <button v-for="s in ['open','in_progress','done']" :key="s"
          @click="setStatus(s)"
          class="px-3 py-1 text-xs rounded-full border transition-colors"
          :class="td.task.status === s ? 'bg-violet-500 text-white border-violet-500' : 'hover:bg-gray-50'">
          {{ s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1) }}
        </button>
      </div>

      <!-- Notes -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-800">Notes</h2>
        </div>

        <!-- VULN: XSS — note.text rendered as raw HTML via v-html -->
        <div v-if="!td.notes?.length" class="text-gray-400 text-sm">No notes yet.</div>
        <div v-for="note in td.notes" :key="note.id" class="bg-white border rounded-lg p-4 mb-3">
          <div class="flex items-start justify-between">
            <div class="font-medium text-gray-800 text-sm">{{ note.title }}</div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">{{ note.username }}</span>
              <button @click="deleteNote(note.id)" class="text-xs text-red-400 hover:text-red-600">Delete</button>
            </div>
          </div>
          <!-- VULN: XSS — note.text rendered as raw HTML (v-html) -->
          <div class="text-sm text-gray-700 mt-2 prose prose-sm max-w-none" v-html="note.text" />
          <div v-if="note.image" class="mt-2">
            <img :src="note.image" alt="Note image" class="max-w-xs rounded" />
          </div>
          <div class="text-xs text-gray-400 mt-2">{{ note.created_at }}</div>
        </div>

        <!-- Add Note Form -->
        <div class="bg-gray-50 border rounded-lg p-4 mt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Add Note</h3>
          <form @submit.prevent="addNote" class="space-y-3">
            <input v-model="noteForm.title" required placeholder="Title"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            <textarea v-model="noteForm.text" rows="3" placeholder="Content"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            <input v-model="noteForm.image" placeholder="Image URL (optional)"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            <button type="submit" class="px-4 py-2 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600">
              Add Note
            </button>
          </form>
        </div>
      </div>

      <!-- File Attachments -->
      <div v-if="td.files?.length > 0" class="mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">Attachments</h2>
        <div class="space-y-1">
          <div v-for="f in td.files" :key="f.id" class="flex items-center gap-3 text-sm bg-white border rounded p-2">
            <a :href="f.path" target="_blank" class="text-violet-600 hover:underline flex-1">{{ f.name }}</a>
            <span class="text-xs text-gray-400">{{ f.uploaded_by_username }}</span>
          </div>
        </div>
      </div>

      <!-- File Upload -->
      <div class="bg-white border rounded-lg p-4">
        <h3 class="font-semibold text-gray-800 mb-3">Upload File</h3>
        <div class="flex gap-3">
          <input type="file" ref="fileInput" class="flex-1 text-sm border rounded px-2 py-1" />
          <button @click="uploadFile" class="px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600">Upload</button>
        </div>
        <div v-if="uploadMsg" class="text-sm mt-2" :class="uploadMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'">{{ uploadMsg }}</div>
      </div>

      <!-- Edit Task Modal -->
      <div v-if="showEdit" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
          <h2 class="text-lg font-bold mb-4">Edit Task</h2>
          <form @submit.prevent="saveEdit" class="space-y-3">
            <input v-model="editForm.title" required placeholder="Title" class="w-full border rounded-lg px-3 py-2 text-sm" />
            <textarea v-model="editForm.text" placeholder="Description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm" />
            <select v-model="editForm.status" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = route.params.id

const { data, pending, error: fetchError, refresh } = await useFetch(`/api/tasks/${id}`)
const td = computed(() => data.value as any)

const showEdit = ref(false)
const fileInput = ref<HTMLInputElement>()
const uploadMsg = ref('')

const noteForm = reactive({ title: '', text: '', image: '' })
const editForm = reactive({
  title: (data.value as any)?.task?.title || '',
  text: (data.value as any)?.task?.text || '',
  status: (data.value as any)?.task?.status || 'open',
  priority: (data.value as any)?.task?.priority || 2,
  due_date: (data.value as any)?.task?.due_date || '',
})

watch(data, (d) => {
  if ((d as any)?.task) {
    const t = (d as any).task
    editForm.title = t.title
    editForm.text = t.text
    editForm.status = t.status
    editForm.priority = t.priority
    editForm.due_date = t.due_date
  }
})

async function addNote() {
  await $fetch('/api/notes', {
    method: 'POST',
    body: { task_id: id, ...noteForm },
  })
  Object.assign(noteForm, { title: '', text: '', image: '' })
  await refresh()
}

async function deleteNote(noteId: number) {
  if (confirm('Delete this note?')) {
    await $fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
    await refresh()
  }
}

async function setStatus(status: string) {
  await $fetch(`/api/tasks/${id}`, { method: 'PUT', body: { status } })
  await refresh()
}

async function saveEdit() {
  await $fetch(`/api/tasks/${id}`, { method: 'PUT', body: { ...editForm } })
  showEdit.value = false
  await refresh()
}

async function confirmDelete() {
  if (confirm('Delete this task?')) {
    await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    navigateTo('/tasks')
  }
}

async function uploadFile() {
  uploadMsg.value = ''
  const file = fileInput.value?.files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  fd.append('task_id', String(id))
  try {
    const res: any = await $fetch('/api/files/upload', { method: 'POST', body: fd })
    uploadMsg.value = `Uploaded: ${res.file.name}`
    await refresh()
  } catch (e: any) {
    uploadMsg.value = `Error: ${e.data?.message || 'Upload failed'}`
  }
}
</script>
