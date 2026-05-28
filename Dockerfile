# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Native build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Seed the database (baked into the image — resets on each container start)
RUN npx tsx server/utils/seed.ts

# Build Nuxt — outputs to .output/
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app

# Copy Nuxt server output
COPY --from=builder /app/.output ./.output

# Copy seeded SQLite database
COPY --from=builder /app/data ./data

# Copy node_modules so better-sqlite3 native addon is available at runtime
COPY --from=builder /app/node_modules ./node_modules

# Uploads directory (ephemeral — mount an EFS volume here for persistence)
RUN mkdir -p public/uploads

EXPOSE 3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
