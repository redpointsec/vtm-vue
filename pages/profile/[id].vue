<template>
  <div class="p-8 max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Edit Profile</h1>
<div v-if="pending" class="text-gray-500">Loading...</div>
    <div v-else-if="profileData">
      <div class="bg-white border rounded-xl p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-2xl font-bold text-violet-300">
            {{ profileData.username?.charAt(0)?.toUpperCase() }}
          </div>
          <div>
            <div class="text-lg font-semibold text-gray-900">{{ profileData.username }}</div>
            <div v-if="profileData.is_staff" class="text-xs text-amber-600 font-medium">Admin</div>
          </div>
        </div>

        <form @submit.prevent="saveProfile" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input v-model="form.first_name" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input v-model="form.last_name" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input v-model="form.email" type="email" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input v-model="form.dob" type="date" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">SSN</label>
              <input v-model="form.ssn" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="###-##-####" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              New Password
              <span class="text-gray-400 text-xs ml-1">(leave blank to keep current)</span>
            </label>
            <input v-model="form.password" type="password" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          <div v-if="message" class="py-2 text-sm" :class="isError ? 'text-red-600' : 'text-green-600'">{{ message }}</div>

          <div class="flex gap-3">
            <button type="submit" :disabled="saving"
              class="px-6 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const userId = route.params.id

// VULN: Fetches any user's profile — relies on users list endpoint
const { data: usersData, pending } = await useFetch('/api/users')

const profileData = computed(() => {
  const users = (usersData.value as any)?.users || []
  return users.find((u: any) => String(u.id) === String(userId))
})

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  dob: '',
  ssn: '',
  password: '',
})

const message = ref('')
const isError = ref(false)
const saving = ref(false)

watch(profileData, (p) => {
  if (p) {
    form.first_name = p.first_name || ''
    form.last_name = p.last_name || ''
    form.email = p.email || ''
    form.dob = p.dob || ''
    form.ssn = p.ssn || ''
  }
}, { immediate: true })

async function saveProfile() {
  saving.value = true
  message.value = ''
  isError.value = false
  try {
    // VULN: IDOR — PUT /api/users/:id with no ownership check
    const body: any = { ...form }
    if (!body.password) delete body.password
    await $fetch(`/api/users/${userId}`, { method: 'PUT', body })
    message.value = 'Profile updated successfully!'
  } catch (e: any) {
    isError.value = true
    message.value = e.data?.message || 'Update failed'
  } finally {
    saving.value = false
  }
}
</script>
