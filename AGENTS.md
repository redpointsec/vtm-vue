# AGENTS.md — VTM Vue (Nuxt 3 Vulnerable Task Manager)

> **DO NOT FIX THE VULNERABILITIES IN THIS APPLICATION.**
> This is an intentionally vulnerable app for security training. All vulnerabilities are intentional and must remain as-is.

---

## Project Overview

- **Framework:** Nuxt 3 + Vue 3 + TypeScript
- **Database:** SQLite via better-sqlite3 (`data/vtm-vue.sqlite`)
- **Auth:** JWT in non-httpOnly cookie via `jose`
- **File storage:** `public/uploads/`
- **Chatbot:** OpenAI SDK → OpenRouter

## Running the App

```bash
npm install
npm run seed    # seed database (run once)
npm run dev     # dev server → http://localhost:3000
```

## Intentional Vulnerabilities — DO NOT FIX

### 1. SQL Injection

**Three injection points — all use raw template literal string interpolation:**

- `server/api/search.get.ts` — `q` param injected directly:
  ```ts
  db.prepare(`SELECT * FROM tasks WHERE title LIKE '%${q}%'`).all()
  ```

- `server/api/auth/forgot-password.post.ts` — `email` param injected:
  ```ts
  db.prepare(`SELECT * FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.email = '${email}'`).get()
  ```

- `server/api/projects/[id].get.ts` — `id` param injected:
  ```ts
  db.prepare(`SELECT *, (SELECT COUNT(*) FROM tasks WHERE project_id = ${id} ...) FROM projects WHERE id = ${id}`).get()
  ```

**Also in chatbot:** `server/utils/chatbot-tools.ts` — `search_database` tool

### 2. Command Injection

`server/api/ping.post.ts` — Incomplete blacklist: only removes `;`, `&&`, `||`, `` ` ``.
`$()`, `|`, newlines, etc. still work.

```ts
const sanitized = host.replace(/;/g, '').replace(/&&/g, '').replace(/\|\|/g, '').replace(/`/g, '')
execSync(`ping -c 1 ${sanitized}`, ...)
```

### 3. SSRF

`server/api/files/import.post.ts` — No URL validation:

```ts
const response = await fetch(sourceUrl)  // any URL — internal IPs, file://, etc.
```

### 4. IDOR

`server/api/users/[id].put.ts` — No ownership check. Any authenticated user can PUT to `/api/users/1` to edit the admin's profile, SSN, DOB, or password.

### 5. Unsafe File Upload

`server/api/files/upload.post.ts` — No extension or MIME type validation. Filename taken from user-supplied `name` field or original filename. Files stored in `public/uploads/` (web accessible).

### 6. Weak Password Hashing

All auth handlers use `crypto.createHash('md5').update(password).digest('hex')` — no salt, no bcrypt/argon2.

### 7. Weak JWT / Session

`server/utils/auth.ts`:
- `httpOnly: false` — cookie readable via JavaScript
- `secure: false` — sent over HTTP
- 365-day expiry
- Hardcoded fallback secret: `vtm-vue-default-training-secret`

### 8. Open Redirect

`server/api/auth/login.post.ts`:
```ts
const next = body.next || query.next || '/dashboard'
return { redirect: next }  // absolute URLs accepted, no validation
```

### 9. Sensitive Data Exposure

`server/api/debug.get.ts` — Returns `process.env` (all env vars) and all request headers. No authentication required.

### 10. Sensitive Logging

`server/api/auth/login.post.ts`:
```ts
console.warn(`VTM failed login username=${username} password=${password}`)
```

### 11. CSRF Not Enforced

No CSRF token validation on any state-changing endpoint (login, register, create/update/delete project/task/note, profile update, file upload, ping, chat).

### 12. XSS (Stored)

`pages/tasks/[id].vue` and `pages/projects/[id].vue` — Note text and project descriptions rendered with `v-html`:
```vue
<div v-html="note.text" />
<div v-html="data.project.text" />
```

### 13. AI Chatbot Vulnerabilities

`server/utils/chatbot-tools.ts`:
- `get_users` tool returns SSN, DOB, reset_token for ALL users — no authorization
- `search_database` tool runs the same raw SQL injection as `/api/search`
- `update_project`, `update_task`, `update_note` tools have no ownership checks

---

## File Structure Reference

```
server/
  api/
    auth/         login, logout, register, forgot-password, reset-password
    projects/     CRUD + SQL injection in [id].get.ts
    tasks/        CRUD
    notes/        CUD
    files/        upload (unsafe), import (SSRF)
    users/        list, [id] PUT (IDOR)
    chat/         AI chatbot endpoint + sessions/messages
    search.get.ts     SQL injection
    ping.post.ts      command injection
    debug.get.ts      env/header exposure
  utils/
    db.ts         SQLite init + auto-seed
    auth.ts       weak JWT helpers
    chatbot-tools.ts  vulnerable AI tool definitions
    seed.ts       standalone seed script
pages/
  login, register, forgot-password, reset-password
  dashboard, projects/[id], tasks/[id]
  profile/[id]   IDOR demo
  users, search, ping, chat, debug
```
