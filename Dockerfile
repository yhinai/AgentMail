# Dockerfile for AutoBazaaar
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build || echo "Build will happen at runtime"

# Expose ports
EXPOSE 3000 9090

# Start command
CMD ["npm", "run", "start"]

