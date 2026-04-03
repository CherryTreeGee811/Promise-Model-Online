# Use Nginx as the base image
FROM nginx:stable-alpine-slim

# Install curl for healthchecks
RUN apk add --no-cache curl

# Create a non-root user and group
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# Create app directory and set ownership
RUN mkdir -p /app/wwwroot && \
    chown -R appuser:appgroup /app

# Copy static files
COPY PromiseModelOnline.Client/wwwroot /app/wwwroot

# Ensure Nginx can access its runtime directories
RUN chown -R appuser:appgroup /var/cache/nginx /var/run

# Configure key and certificate for SSL
#COPY PromiseModelOnline.Client/cert.pem /etc/nginx/cert.pem
#COPY PromiseModelOnline.Client/key.pem /etc/nginx/key.pem

# Configure needed mime types
COPY PromiseModelOnline.Client/mime.types /etc/nginx/mime.types

# Copy custom main nginx.conf
COPY PromiseModelOnline.Client/nginx.conf /etc/nginx/nginx.conf

# Copy default configuration
COPY PromiseModelOnline.Client/default.conf /etc/nginx/conf.d/default.conf

# Copy SSL certificate and key into the image
COPY PromiseModelOnline.Client/cert.pem /etc/nginx/cert.pem
COPY PromiseModelOnline.Client/key.pem /etc/nginx/key.pem
RUN  chown appuser:appgroup /etc/nginx/key.pem /etc/nginx/cert.pem
RUN chmod 644 /etc/nginx/cert.pem && chmod 600 /etc/nginx/key.pem

USER appuser

# Expose the port Nginx will run on
EXPOSE 9000/tcp

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
