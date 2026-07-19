FROM nginx:stable-alpine-slim

RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

RUN mkdir -p /app/wwwroot && \
    chown -R appuser:appgroup /app

RUN chown -R appuser:appgroup /var/cache/nginx /var/run

COPY PromiseModelOnline.Client/mime.types /etc/nginx/mime.types
COPY PromiseModelOnline.Proxy/nginx.conf /etc/nginx/nginx.conf
COPY PromiseModelOnline.Proxy/default.conf /etc/nginx/conf.d/default.conf

USER appuser

EXPOSE 9000/tcp

CMD ["nginx", "-g", "daemon off;"]
