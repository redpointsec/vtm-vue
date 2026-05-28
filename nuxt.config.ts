export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  devtools: { enabled: false },
  nitro: {
    experimental: { wasm: false },
    externals: {
      external: ['better-sqlite3']
    }
  },
  runtimeConfig: {
    vtmAuthSecret: process.env.VTM_VUE_AUTH_SECRET || 'vtm-vue-default-training-secret',
    openrouterApiKey: process.env.VTM_VUE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '',
    openrouterBaseUrl: process.env.VTM_VUE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    vtmModel: process.env.VTM_VUE_MODEL || 'openai/gpt-4o-mini',
  }
})
