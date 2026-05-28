<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-500 text-sm mt-1">Welcome back, {{ authUser?.username }}</p>
    </div>

    <div v-if="pending" class="text-gray-500">Loading...</div>
    <div v-else-if="dd">
      <!-- Stats -->
      <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="text-3xl font-bold text-violet-600">{{ dd.stats?.totalProjects }}</div>
          <div class="text-sm text-gray-500 mt-1">Total Projects</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="text-3xl font-bold text-amber-600">{{ dd.stats?.openTasks }}</div>
          <div class="text-sm text-gray-500 mt-1">Open Tasks</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="text-3xl font-bold text-green-600">{{ dd.stats?.totalUsers }}</div>
          <div class="text-sm text-gray-500 mt-1">Team Members</div>
        </div>
      </div>

      <!-- Recent content -->
      <div class="grid grid-cols-2 gap-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Recent Tasks</h2>
          <div class="space-y-3">
            <TaskCard v-for="task in dd.recentTasks" :key="task.id" :task="task" />
          </div>
          <NuxtLink to="/tasks" class="text-violet-600 hover:underline text-sm mt-3 block">View all tasks →</NuxtLink>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Recent Projects</h2>
          <div class="space-y-3">
            <ProjectCard v-for="project in dd.recentProjects" :key="project.id" :project="project" />
          </div>
          <NuxtLink to="/projects" class="text-violet-600 hover:underline text-sm mt-3 block">View all projects →</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user: authUser, loadUser } = useAuth()
onMounted(() => loadUser())

const { data, pending } = await useFetch('/api/dashboard')
const dd = computed(() => data.value as any)
</script>
