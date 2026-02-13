# infrastructure/caddy/Dockerfile
# Caddy reverse proxy with OVH DNS plugin for wildcard TLS certificates
#
# This image provides automatic HTTPS for all *.alecia.fr subdomains
# using DNS-01 challenge via OVH API

FROM caddy:2-builder AS builder

# Build Caddy with OVH DNS plugin for DNS-01 challenge
# This allows us to get wildcard certificates for *.alecia.fr
RUN xcaddy build \
    --with github.com/caddy-dns/ovh

FROM caddy:2-alpine

# Copy the custom-built Caddy binary with OVH DNS support
COPY --from=builder /usr/bin/caddy /usr/bin/caddy

# Copy Caddyfile configuration
COPY infrastructure/caddy/Caddyfile /etc/caddy/Caddyfile

# Create directory for TLS certificates
RUN mkdir -p /data/caddy

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Run Caddy with the config file
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
