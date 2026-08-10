FROM node:20-alpine AS base
WORKDIR /app

# Build context = repo root (unyt-main), so shared/ and backend/ both reachable.
COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY shared ./shared
COPY backend ./backend

RUN cd backend && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY --from=base /app/backend/dist ./backend/dist
COPY --from=base /app/shared ./shared

EXPOSE 3001
CMD ["node", "backend/dist/backend/src/server.js"]
