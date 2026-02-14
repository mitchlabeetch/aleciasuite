FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy application files
COPY server.js ./
COPY public ./public
COPY views ./views

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3100/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

CMD ["node", "server.js"]
