<template>
  <nav class="bg-violet-950 text-white w-64 min-h-screen flex flex-col fixed left-0 top-0 z-40">
    <div class="p-4 border-b border-violet-900">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-violet-500 rounded flex items-center justify-center font-bold text-sm">VTM</div>
        <div>
          <div class="font-bold text-sm">VTM Vue</div>
          <div class="text-xs text-violet-300">Task Manager</div>
        </div>
      </div>
    </div>

    <div class="p-3 border-b border-violet-900">
      <div class="flex items-center gap-2 text-sm">
        <div class="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold">
          {{ user?.username?.charAt(0)?.toUpperCase() || '?' }}
        </div>
        <div>
          <div class="text-white font-medium">{{ user?.username || 'Guest' }}</div>
          <div v-if="user?.isAdmin" class="text-xs text-amber-400">Admin</div>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto py-2">
      <NavLink to="/dashboard" icon="grid">Dashboard</NavLink>
      <NavLink to="/projects" icon="folder">Projects</NavLink>
      <NavLink to="/tasks" icon="check">Tasks</NavLink>
      <NavLink to="/search" icon="search">Search</NavLink>

      <div class="px-4 pt-4 pb-1 text-xs text-violet-300 uppercase tracking-wider">Tools</div>
      <NavLink to="/ping" icon="signal">Ping</NavLink>
      <NavLink to="/chat" icon="chat">AI Chat</NavLink>
      <NavLink to="/debug" icon="bug">Debug</NavLink>

      <div class="px-4 pt-4 pb-1 text-xs text-violet-300 uppercase tracking-wider">Account</div>
      <NavLink to="/users" icon="users">Users</NavLink>
      <NavLink v-if="user" :to="`/profile/${user.userId}`" icon="user">Profile</NavLink>
    </div>

    <div class="p-3 border-t border-violet-900">
      <button
        @click="handleLogout"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-200 hover:bg-violet-900 hover:text-white rounded transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Logout
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { user, loadUser, logout } = useAuth()

onMounted(() => {
  loadUser()
})

async function handleLogout() {
  await logout()
}
</script>

<script lang="ts">
// NavLink helper component defined inline
</script>
