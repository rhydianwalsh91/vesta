# API image: builds the web app, then runs the API, which also serves it.

FROM node:26-slim AS base
RUN npm install -g pnpm@12.9.1
WORKDIR /app
# Manifests first, so dependency installs are cached until they change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
COPY packages/shared/package.json packages/shared/

FROM base AS build
# Tests aren't run here, so skip mongodb-memory-server's mongod download.
ENV MONGOMS_DISABLE_POSTINSTALL=1
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @vesta/web build

FROM base AS deps
RUN pnpm install --frozen-lockfile --prod --filter "@vesta/api..."

FROM node:26-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app ./
COPY packages/shared/src packages/shared/src
COPY packages/core/src packages/core/src
COPY apps/api/src apps/api/src
COPY --from=build /app/apps/web/dist apps/web/dist
WORKDIR /app/apps/api
USER node
EXPOSE 3000
CMD ["node", "--import", "tsx", "src/index.ts"]
