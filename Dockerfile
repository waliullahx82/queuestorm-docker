FROM node:22-alpine AS client-build

WORKDIR /app

COPY client/package*.json ./client/
RUN npm --prefix client ci

COPY client ./client
RUN npm --prefix client run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY api ./api
COPY lib ./lib
COPY server ./server
COPY package*.json ./
COPY --from=client-build /app/dist ./dist

EXPOSE 3001

CMD ["node", "server/server.local.js"]