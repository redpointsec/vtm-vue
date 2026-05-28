<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Users</h1>
        <p class="text-sm text-gray-500 mt-1">All registered users</p>
      </div>
    </div>

    <div v-if="pending" class="text-gray-500">Loading...</div>
    <div v-else>
      <div class="bg-white border rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Username</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">DOB</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="user in typedData?.users" :key="user.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-500">{{ user.id }}</td>
              <td class="px-4 py-3 font-medium text-gray-900">{{ user.username }}</td>
              <td class="px-4 py-3 text-gray-600">{{ user.first_name }} {{ user.last_name }}</td>
              <td class="px-4 py-3 text-gray-600">{{ user.email }}</td>
              <td class="px-4 py-3 text-gray-600">{{ user.dob }}</td>
              <td class="px-4 py-3">
                <span v-if="user.is_staff" class="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>
                <span v-else class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Member</span>
              </td>
              <td class="px-4 py-3">
                <NuxtLink :to="`/profile/${user.id}`" class="text-violet-600 hover:underline text-xs">Edit Profile</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data, pending } = await useFetch('/api/users')
const typedData = computed(() => data.value as any)
</script>
