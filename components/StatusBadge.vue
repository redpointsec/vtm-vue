<template>
  <span :class="badgeClass" class="text-xs font-medium px-2 py-0.5 rounded-full">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()

const label = computed(() => {
  if (props.status === 'done') return 'Done'
  if (props.status === 'in_progress') return 'In Progress'
  return 'Open'
})
const badgeClass = computed(() => {
  if (props.status === 'done') return 'bg-green-100 text-green-700'
  if (props.status === 'in_progress') return 'bg-violet-100 text-violet-700'
  return 'bg-gray-100 text-gray-600'
})
</script>
