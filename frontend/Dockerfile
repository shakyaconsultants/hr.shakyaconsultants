FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS build
ARG VITE_API_BASE_URL=http://localhost:4000
ARG VITE_API_PREFIX=/api/v1
ARG VITE_APP_NAME=HR Shakya ERP
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_PREFIX=$VITE_API_PREFIX
ENV VITE_APP_NAME=$VITE_APP_NAME
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
