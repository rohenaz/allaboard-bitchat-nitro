# Build stage
FROM oven/bun:1 as builder
WORKDIR /app

# Add build arguments
ARG VITE_API_URL
ARG VITE_HANDCASH_APP_ID
ARG VITE_HANDCASH_API_URL
ARG VITE_SIGMA_CLIENT_ID
ARG VITE_SIGMA_ISSUER_URL

# Set as environment variables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_HANDCASH_APP_ID=$VITE_HANDCASH_APP_ID
ENV VITE_HANDCASH_API_URL=$VITE_HANDCASH_API_URL
ENV VITE_SIGMA_CLIENT_ID=$VITE_SIGMA_CLIENT_ID
ENV VITE_SIGMA_ISSUER_URL=$VITE_SIGMA_ISSUER_URL

COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

# Production stage
FROM caddy:alpine
COPY --from=builder /app/build /srv/
COPY Caddyfile /etc/caddy/Caddyfile
