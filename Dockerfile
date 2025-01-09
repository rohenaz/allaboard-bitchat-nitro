# Build stage
FROM oven/bun:1 as builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN ls -la && bun run build && ls -la dist

# Production stage
FROM caddy:2-alpine
WORKDIR /srv
COPY --from=builder /app/build /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
EXPOSE 443 