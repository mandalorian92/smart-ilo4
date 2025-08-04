# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN ls -l /app/frontend/src
RUN npm run build

# Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci
COPY src ./src
COPY --from=frontend-build /app/frontend/build ./frontend/build
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy only built files and essentials
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/frontend/build ./frontend/build
COPY package.json package-lock.json* ./

# Only need dependencies at runtime
RUN npm ci --production

# Create config directory for app configuration
RUN mkdir -p config

# Use a dynamic port - can be configured via app settings or environment
EXPOSE 8443
ENV DEFAULT_PORT=8443

CMD ["node", "dist/index.js"]