# Stage 1: Build the Vite React app
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine
# Copy our custom nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built files from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
