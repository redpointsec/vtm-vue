# VTM Vue — Vulnerable Task Manager (Nuxt 3)

> **WARNING: This application is INTENTIONALLY VULNERABLE. It is designed exclusively for security training and pen-testing education. Never deploy to production or expose to untrusted networks.**

## What is this?

VTM Vue is the Nuxt 3 / Vue 3 edition of the Vulnerable Task Manager — a deliberately insecure web application used to teach common web vulnerabilities in a safe, controlled environment. It models the same vulnerability set as the Django (`vtm`) and Next.js (`vtm-next`) versions in this repository.

## Quick Start

```bash
cd vtm-vue
npm install
npm run seed       # creates and seeds the SQLite database
npm run dev        # starts the dev server at http://localhost:3000
```

## Default Accounts

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | test123   | Admin |
| chris    | test123   | User  |
| pm       | test123   | User  |
| alex     | password  | User  |

## Environment Variables (Optional)

| Variable | Description | Default |
|---|---|---|
| `VTM_VUE_AUTH_SECRET` | JWT signing secret | `vtm-vue-default-training-secret` |
| `VTM_VUE_OPENROUTER_API_KEY` | OpenRouter API key for chatbot | — |
| `VTM_VUE_OPENROUTER_BASE_URL` | OpenRouter base URL | `https://openrouter.ai/api/v1` |
| `VTM_VUE_MODEL` | LLM model name | `openai/gpt-4o-mini` |

## Vulnerability Inventory

| # | Vulnerability | Route / Location |
|---|---|---|
| 1 | SQL Injection (search) | `GET /api/search?q=` |
| 2 | SQL Injection (forgot password) | `POST /api/auth/forgot-password` |
| 3 | SQL Injection (project detail) | `GET /api/projects/:id` |
| 4 | Command Injection | `POST /api/ping` |
| 5 | SSRF | `POST /api/files/import` |
| 6 | IDOR (profile edit) | `PUT /api/users/:id` |
| 7 | Unsafe File Upload | `POST /api/files/upload` |
| 8 | Weak Password Hashing (MD5) | All auth endpoints |
| 9 | Weak JWT / Session | `server/utils/auth.ts` |
| 10 | Open Redirect | `POST /api/auth/login` |
| 11 | Sensitive Data Exposure | `GET /api/debug` |
| 12 | Sensitive Logging | `POST /api/auth/login` (server log) |
| 13 | CSRF Not Enforced | All state-changing endpoints |
| 14 | XSS (stored) | Task notes, project descriptions via `v-html` |
| 15 | AI Data Exposure | `POST /api/chat` — `get_users` tool returns SSN/DOB/token |
| 16 | AI SQLi via chatbot | `search_database` tool uses raw SQL |
| 17 | No per-object auth in AI tools | All chatbot write tools |
