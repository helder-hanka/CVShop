# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
COPY nx.json tsconfig.base.json ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm nx build api-gateway --configuration=production

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist/apps/api-gateway ./dist
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod --frozen-lockfile
EXPOSE 3000
CMD ["node", "dist/main.js"]