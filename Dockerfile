FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY ./src ./src
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]