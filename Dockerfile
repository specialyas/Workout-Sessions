# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.17.1

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

RUN npx prisma generate

RUN npm prune --omit=dev

USER node

EXPOSE 8000

CMD ["node", "src/index.js"]