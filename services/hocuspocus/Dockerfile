FROM node:20-alpine
WORKDIR /app

# Copy package files from services/hocuspocus
COPY services/hocuspocus/package*.json ./
RUN npm install

# Copy source code from services/hocuspocus
COPY services/hocuspocus/ ./

# Build TypeScript
RUN npm run build

# Clean dev dependencies
RUN npm prune --production

EXPOSE 1234
CMD ["node", "dist/index.js"]
