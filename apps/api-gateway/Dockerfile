# # ---- deps (prod) ----
# FROM node:20-alpine AS deps
# WORKDIR /app
# ENV CI=true
# RUN corepack enable && corepack prepare pnpm@latest --activate
# # Manifests du workspace
# COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
# COPY apps ./apps
# COPY libs ./libs
# # Installe UNIQUEMENT les deps runtime (inclut tslib si présent au root)
# RUN pnpm install --frozen-lockfile --prod

# # ---- build ----
# FROM node:20-alpine AS build
# WORKDIR /app
# ENV CI=true
# RUN corepack enable && corepack prepare pnpm@latest --activate
# COPY . .
# RUN pnpm install --frozen-lockfile
# # build la bonne app (exemple: api-gateway)
# RUN pnpm nx build api-gateway --configuration=production

# # ---- runtime ----
# FROM node:20-alpine
# WORKDIR /app
# ENV NODE_ENV=production
# # Artefacts buildés
# COPY --from=build /app/dist/apps/api-gateway ./dist/apps/api-gateway
# # Deps prod pour tout le workspace (contient tslib)
# COPY --from=deps  /app/node_modules          ./node_modules
# # (optionnel) si l'app lit son package.json
# # COPY apps/api-gateway/package.json ./
# EXPOSE 3000
# CMD ["node", "dist/apps/api-gateway/main.js"]


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
# CMD ["node", "dist/apps/api-gateway/main.js"]