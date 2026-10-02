# --- Stage 1: install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev

# --- Stage 2: run the app (small final image) ---
FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
