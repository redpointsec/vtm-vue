<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <NuxtLink :to="`/tasks/${task.id}`" class="font-medium text-gray-900 hover:text-violet-600 truncate block">
          {{ task.title }}
        </NuxtLink>
        <div v-if="task.project_title" class="text-xs text-gray-500 mt-1">
          {{ task.project_title }}
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <PriorityBadge :priority="task.priority" />
        <StatusBadge :status="task.status" />
      </div>
    </div>
    <div v-if="task.text" class="text-sm text-gray-600 mt-2 line-clamp-2">{{ task.text }}</div>
    <div v-if="task.due_date" class="text-xs text-gray-400 mt-2">Due: {{ task.due_date }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  task: any
}>()
</script>
