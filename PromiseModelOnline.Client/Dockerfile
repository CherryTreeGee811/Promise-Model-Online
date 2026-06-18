# Stage 1: Build JS with Vite
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY PromiseModelOnline.Client/wwwroot ./PromiseModelOnline.Client/wwwroot
COPY vite.config.js ./
RUN npm run build

# Stage 2: Nginx
FROM nginx:stable-alpine-slim

RUN apk add --no-cache curl=8.19.0-r0

RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

RUN mkdir -p /app/wwwroot && \
    chown -R appuser:appgroup /app

COPY PromiseModelOnline.Client/wwwroot /app/wwwroot
COPY --from=build /app/PromiseModelOnline.Client/wwwroot/dist /app/wwwroot/dist

RUN chown -R appuser:appgroup /var/cache/nginx /var/run

COPY PromiseModelOnline.Client/mime.types /etc/nginx/mime.types
COPY PromiseModelOnline.Client/nginx.conf /etc/nginx/nginx.conf
COPY PromiseModelOnline.Client/default.conf /etc/nginx/conf.d/default.conf
COPY PromiseModelOnline.Client/cert.pem /etc/nginx/cert.pem
COPY PromiseModelOnline.Client/key.pem /etc/nginx/key.pem
RUN  chown appuser:appgroup /etc/nginx/key.pem /etc/nginx/cert.pem
RUN chmod 644 /etc/nginx/cert.pem && chmod 600 /etc/nginx/key.pem

USER appuser

EXPOSE 9000/tcp

CMD ["nginx", "-g", "daemon off;"]
