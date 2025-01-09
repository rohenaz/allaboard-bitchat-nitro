# Build stage
FROM oven/bun:1 as builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

# Production stage
FROM caddy:alpine
COPY --from=builder /app/build /srv/
COPY Caddyfile /etc/caddy/Caddyfile
