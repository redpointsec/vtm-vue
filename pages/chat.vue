<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Session Sidebar -->
    <div class="w-64 bg-violet-50 border-r flex flex-col">
      <div class="p-4 border-b bg-white">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-gray-800 text-sm">AI Chat</h2>
          <button @click="newSession" class="text-xs text-violet-600 hover:underline">+ New</button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto py-2">
        <div
          v-for="s in sessions" :key="s.id"
          @click="loadSession(s.id)"
          class="px-4 py-2 text-sm cursor-pointer hover:bg-violet-100 transition-colors"
          :class="{ 'bg-violet-100 font-medium': currentSessionId === s.id }"
        >
          <div class="truncate">{{ s.title || 'New Chat' }}</div>
          <div class="text-xs text-gray-400">{{ s.updated_at?.slice(0,10) }}</div>
        </div>
        <div v-if="sessions.length === 0" class="text-center text-xs text-gray-400 py-6">No conversations yet</div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-white border-b px-6 py-3">
        <h1 class="font-semibold text-gray-900">Task Manager AI</h1>
        <p class="text-xs text-gray-500">Your AI assistant for projects and tasks</p>
      </div>

      <!-- Messages -->
      <div ref="messagesEl" class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        <div v-if="messages.length === 0" class="text-center text-gray-400 py-12">
          <p class="text-sm">Ask me anything about your tasks and projects.</p>
        </div>

        <div v-for="msg in messages" :key="msg.id" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
          <div class="max-w-2xl rounded-xl px-4 py-3 text-sm shadow-sm"
            :class="msg.role === 'user' ? 'bg-violet-500 text-white' : 'bg-white border text-gray-800'">
            <div class="whitespace-pre-wrap">{{ msg.content }}</div>
          </div>
        </div>

        <div v-if="loading" class="flex justify-start">
          <div class="bg-white border rounded-xl px-4 py-3 text-sm text-gray-500 shadow-sm">
            <span class="animate-pulse">Thinking...</span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="bg-white border-t p-4">
        <form @submit.prevent="sendMessage" class="flex gap-3">
          <input
            ref="inputEl"
            v-model="input"
            type="text"
            placeholder="Ask about your tasks, projects, or users..."
            :disabled="loading"
            class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
          />
          <button
            type="submit"
            :disabled="loading || !input.trim()"
            class="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
        <div v-if="error" class="text-red-500 text-xs mt-2">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const sessions = ref<any[]>([])
const currentSessionId = ref<number | null>(null)
const messages = ref<any[]>([])
const input = ref('')
const loading = ref(false)
const error = ref('')
const messagesEl = ref<HTMLElement>()
const inputEl = ref<HTMLInputElement>()

let msgIdCounter = 0

onMounted(async () => {
  await loadSessions()
})

async function loadSessions() {
  try {
    const data = await $fetch<any>('/api/chat/sessions')
    sessions.value = data.sessions || []
  } catch {}
}

function newSession() {
  currentSessionId.value = null
  messages.value = []
}

async function loadSession(id: number) {
  currentSessionId.value = id
  try {
    const data = await $fetch<any>(`/api/chat/messages?session_id=${id}`)
    messages.value = (data.messages || []).map((m: any) => ({ ...m, id: m.id || ++msgIdCounter }))
    scrollToBottom()
  } catch {}
}

async function sendMessage() {
  const msg = input.value.trim()
  if (!msg || loading.value) return

  input.value = ''
  error.value = ''
  messages.value.push({ id: ++msgIdCounter, role: 'user', content: msg })
  loading.value = true
  scrollToBottom()

  try {
    const res = await $fetch<any>('/api/chat', {
      method: 'POST',
      body: { message: msg, session_id: currentSessionId.value || undefined },
    })
    currentSessionId.value = res.session_id
    messages.value.push({ id: ++msgIdCounter, role: 'assistant', content: res.response })
    await loadSessions()
    scrollToBottom()
  } catch (e: any) {
    error.value = e.data?.message || 'Chat request failed'
    messages.value.push({ id: ++msgIdCounter, role: 'assistant', content: `Error: ${error.value}` })
  } finally {
    loading.value = false
    nextTick(() => inputEl.value?.focus())
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}
</script>
