# Stage 1: Build the static production bundle
FROM node:20-alpine AS build

WORKDIR /app

# Copy package configurations and install frontend dependencies
COPY package*.json ./
RUN npm install

# Copy source assets and run build script
COPY . .
RUN npm run build

# Stage 2: Serve the compiled static assets via Nginx
FROM nginx:alpine

# Copy built HTML/JS assets to standard nginx host path
COPY --from=build /app/dist /usr/share/nginx/html

# Overwrite standard Nginx configuration with our custom SPA routing script
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx web server port
EXPOSE 80

# Boot Nginx
CMD ["nginx", "-g", "daemon off;"]
