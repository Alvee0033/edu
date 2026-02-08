---
title: Study Course Discovery Platform
version: 0.1.0
---

# Project Documentation

## 1) Product Summary
The platform helps users discover free study courses from YouTube channels by topic. It provides search, curation, and analytics, plus user-specific saved/assessed courses and progress tracking. The UI uses a bottom dock with three main pages: Dashboard, My Courses, and Profile.

## 2) High-Level Architecture
Clients (Flutter mobile and optional Flutter web) call a NestJS REST API. The API reads/writes PostgreSQL and integrates with YouTube Data API v3. Caching and background jobs reduce YouTube quota use and improve performance.

- Frontend: Flutter (Dart)
- Backend: NestJS (TypeScript)
- Database: PostgreSQL
- External: YouTube Data API v3
- Optional: Redis cache and BullMQ job queue

## 3) Core Features
- Topic-based search for free courses on YouTube
- Analytics on topics, channels, and user activity
- Saved and assessed courses (My Courses)
- Course detail page with video list and progress
- User profile and preferences

## 4) Data Model (ER Diagram)
See `ERD.mmd` for the Mermaid ER diagram.

## 5) API Specification
The OpenAPI skeleton is in `OPENAPI.yaml`.

## 6) Flutter Screen Architecture
### Routes
- `/` -> Auth gate
- `/dashboard` -> Dashboard page
- `/my-courses` -> My Courses page
- `/profile` -> Profile page
- `/course/:id` -> Course detail page

### State Management
- Use `riverpod` for global app state and caching
- Keep view models thin and testable
- Prefer immutable state classes

### UI Structure
- Atomic design: `atoms/`, `molecules/`, `organisms/`, `pages/`
- Reusable widgets for cards, list items, loading, empty states
- Themed typography and colors via `ThemeData`

## 7) Security Model
- JWT access tokens + refresh tokens
- Hash passwords with `argon2` or `bcrypt`
- Input validation via DTOs and `class-validator`
- HTTP security headers via `helmet`
- Rate limiting via `@nestjs/throttler`
- CORS restricted to trusted origins
- Avoid client-side storage for sensitive data on web (use httpOnly cookies)

## 8) YouTube API Usage
- Use `search.list` for topic discovery (100 units per call)
- Use `videos.list` for low-cost details (1 unit per call)
- Cache responses with ETag + TTL
- Refresh metrics with background jobs

## 9) Analytics
Suggested KPIs:
- Top topics by searches
- Most saved courses
- Average course rating
- Completion rate per user
- Total watch time

## 10) Environment Variables
Backend:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `YOUTUBE_API_KEY`
- `REDIS_URL` (optional)

Frontend:
- `API_BASE_URL`

## 11) Build Roadmap
See `ROADMAP.md`.

## 12) DevOps
See `DEVOPS_SCRIPTS.md` for Docker and CI skeletons.
