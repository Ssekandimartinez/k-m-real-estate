FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
COPY . .
RUN npm run db:generate && npm run build
RUN chown -R node:node /app
USER node
EXPOSE 4000
CMD ["npm","run","start","-w","server"]
