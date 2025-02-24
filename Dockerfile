# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --no-cache

COPY . .

RUN npm run build

# Clean up node_modules to reduce image size
RUN rm -rf node_modules

# Stage 2: Serve the application
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


