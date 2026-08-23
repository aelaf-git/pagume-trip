# Pagume provider / admin portals (Vite + React) served by nginx
#
# Uses the host lockfile + a fresh npm ci on glibc (bookworm). Alpine/musl is
# avoided because Vite 8 / rolldown has no reliable musl native binding.
# If the registry is unreachable, build on the host first and use the
# Dockerfile.prebuilt target (see README).
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build


FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]


# Fallback when npm inside Docker cannot reach the registry:
#   cd portals && VITE_API_BASE_URL=... npm ci && npm run build
#   docker compose build --build-arg ... portals  (with dockerfile targeting this)
FROM nginx:alpine AS prebuilt

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
