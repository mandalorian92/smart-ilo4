# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
RUN ls -l /app/frontend/src
RUN yarn build

# Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package.json yarn.lock tsconfig.json ./
RUN yarn install --frozen-lockfile
COPY src ./src
COPY --from=frontend-build /app/frontend/build ./frontend/build
RUN yarn build

# Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy only built files and essentials
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/frontend/build ./frontend/build
COPY package.json yarn.lock ./

# Only need dependencies at runtime
RUN yarn install --production --frozen-lockfile

# Create config directory for app configuration
RUN mkdir -p config

# Use a dynamic port - can be configured via app settings or environment
EXPOSE 8443
ENV DEFAULT_PORT=8443

CMD ["node", "dist/index.js"]