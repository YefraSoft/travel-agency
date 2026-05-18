FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run build

FROM oven/bun:1.3-alpine AS runtime
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=4321
COPY --from=build /app/dist ./dist
CMD ["bun", "./dist/server/entry.mjs"]
