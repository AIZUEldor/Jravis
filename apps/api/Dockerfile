FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/brain-core/package.json packages/brain-core/package.json
COPY packages/policy-engine/package.json packages/policy-engine/package.json
COPY packages/mcp-gateway/package.json packages/mcp-gateway/package.json
RUN npm ci
COPY apps/api apps/api
COPY packages packages
RUN npm run build:core && npm run build -w @jravis/api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=4000
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/migrations ./apps/api/migrations
COPY --from=build /app/packages ./packages
EXPOSE 4000
CMD ["sh", "-c", "node apps/api/dist/db/migrate.js && node apps/api/dist/server.js"]
