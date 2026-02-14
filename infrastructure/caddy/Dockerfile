# infrastructure/caddy/Dockerfile
# Caddy reverse proxy with automatic HTTPS using HTTP-01 challenge
#
# This image provides automatic HTTPS for all alecia.markets subdomains
# using HTTP-01 challenge (requires DNS A records pointing to the VPS)

FROM caddy:2-alpine

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
