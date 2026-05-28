<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <NuxtLink :to="`/projects/${project.id}`" class="font-semibold text-gray-900 hover:text-violet-600 truncate block">
          {{ project.title }}
        </NuxtLink>
        <div class="text-xs text-gray-500 mt-1">By {{ project.created_by_username }}</div>
      </div>
      <PriorityBadge :priority="project.priority" />
    </div>
    <div v-if="project.text" class="text-sm text-gray-600 mt-2 line-clamp-2" v-html="project.text" />
    <div class="flex items-center gap-4 mt-3 text-xs text-gray-400">
      <span>{{ project.task_count || 0 }} tasks</span>
      <span>{{ project.completed_count || 0 }} completed</span>
      <span v-if="project.due_date">Due {{ project.due_date }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  project: any
}>()
</script>
