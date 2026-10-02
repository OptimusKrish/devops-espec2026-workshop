FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production PORT=3000
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package.json index.js ./
USER node
EXPOSE 3000
CMD ["node", "index.js"]
