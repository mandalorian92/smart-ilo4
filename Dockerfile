FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY ./src ./src
RUN yarn add -D @types/node-cron @types/node-fetch @types/base-64
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]