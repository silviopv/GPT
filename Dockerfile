FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
RUN npm install

COPY frontend ./frontend
COPY backend ./backend
RUN npm run build
RUN npm prune --omit=dev --workspaces

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/node_modules ./backend/node_modules

EXPOSE 3000
CMD ["node", "backend/dist/server.js"]
