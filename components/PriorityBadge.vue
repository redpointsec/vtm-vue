<template>
  <span :class="badgeClass" class="text-xs font-medium px-2 py-0.5 rounded-full">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ priority: number | string }>()

const p = computed(() => Number(props.priority))
const label = computed(() => p.value === 1 ? 'High' : p.value === 3 ? 'Low' : 'Medium')
const badgeClass = computed(() =>
  p.value === 1
    ? 'bg-red-100 text-red-700'
    : p.value === 3
    ? 'bg-green-100 text-green-700'
    : 'bg-yellow-100 text-yellow-700'
)
</script>
