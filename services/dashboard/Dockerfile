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

CMD ["node", "server.js"]
