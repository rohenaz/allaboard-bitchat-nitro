# Build stage
FROM oven/bun:1 as builder
WORKDIR /app

# Add build arguments
ARG VITE_BMAP_API_URL
ARG VITE_HANDCASH_APP_ID
ARG VITE_HANDCASH_API_URL
ARG VITE_SIGMA_CLIENT_ID
ARG VITE_SIGMA_ISSUER_URL
ARG BITCHAT_MEMBER_WIF

# Set as environment variables
ENV VITE_BMAP_API_URL=$VITE_BMAP_API_URL
ENV VITE_HANDCASH_APP_ID=$VITE_HANDCASH_APP_ID
ENV VITE_HANDCASH_API_URL=$VITE_HANDCASH_API_URL
ENV VITE_SIGMA_CLIENT_ID=$VITE_SIGMA_CLIENT_ID
ENV VITE_SIGMA_ISSUER_URL=$VITE_SIGMA_ISSUER_URL
ENV BITCHAT_MEMBER_WIF=$BITCHAT_MEMBER_WIF

COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=4096" bun run build 2>&1 || (echo "Build failed, checking for issues..." && cat /app/node_modules/.vite/deps/_metadata.json 2>/dev/null || true && exit 1)

# Production stage
FROM caddy:alpine
COPY --from=builder /app/build /srv/
COPY Caddyfile /etc/caddy/Caddyfile
