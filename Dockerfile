# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app

# Prisma engine needs openssl + libc6-compat on alpine
RUN apk add --no-cache openssl libc6-compat

# Install deps (cached)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Prisma needs the schema at install time for client generation
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Drop dev deps
RUN npm prune --omit=dev

# --- runtime stage ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Needed by Prisma engine
RUN apk add --no-cache openssl libc6-compat

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

# Apply pending migrations, then start
CMD ["sh", "-c", "npx prisma migrate deploy && node build/index.js"]
