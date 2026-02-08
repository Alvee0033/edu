# DevOps Deployment Scripts (Skeleton)

## 1) Docker Compose (Local Dev)
```yaml
version: "3.9"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports:
      - "5432:5432"
  redis:
    image: redis:7
    ports:
      - "6379:6379"
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
      JWT_SECRET: change_me
      JWT_REFRESH_SECRET: change_me
      YOUTUBE_API_KEY: change_me
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
```

## 2) Backend Dockerfile (NestJS)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/main.js"]
```

## 3) Frontend Dockerfile (Flutter Web)
```dockerfile
FROM cirrusci/flutter:stable AS build
WORKDIR /app
COPY . .
RUN flutter pub get
RUN flutter build web

FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
```

## 4) GitHub Actions CI (Backend)
```yaml
name: backend-ci
on:
  push:
    paths: ["backend/**"]
  pull_request:
    paths: ["backend/**"]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: backend
      - run: npm run lint
        working-directory: backend
      - run: npm test
        working-directory: backend
```

## 5) GitHub Actions CI (Flutter)
```yaml
name: frontend-ci
on:
  push:
    paths: ["frontend/**"]
  pull_request:
    paths: ["frontend/**"]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get
        working-directory: frontend
      - run: flutter analyze
        working-directory: frontend
      - run: flutter test
        working-directory: frontend
```
