FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# The build bundles every dependency, so no node_modules at runtime.
FROM oven/bun:1-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/server.ts ./
COPY --from=build /app/items items
COPY --from=build /app/build build
COPY --from=build /app/server server
USER bun
EXPOSE 3000
CMD ["bun", "server.ts"]
