# Entity Documentation

Reference for every database entity (table) in the Edu Courses platform.

---

## Enums

| Enum | Values | Description |
|------|--------|-------------|
| **Role** | `USER`, `ADMIN` | User account role. |
| **AssessmentStatus** | `SAVED`, `IN_PROGRESS`, `COMPLETED`, `ASSESSED` | State of a user’s relationship to a course. |

---

## 1. User

**Table:** `users`

| Attribute | Type | Nullable | Default | Description |
|-----------|------|----------|---------|-------------|
| id | UUID | No | `uuid()` | Primary key. |
| email | String | No | — | Unique login identifier. |
| password_hash | String | No | — | Bcrypt/Argon2 hash; never exposed in API. |
| role | Role | No | `USER` | `USER` or `ADMIN`. |
| created_at | Timestamp | No | `now()` | Registration time. |
| updated_at | Timestamp | No | `updatedAt` | Last row update. |

**Constraints:** `email` UNIQUE.

**Relations:** One optional Profile; many CourseAssessments; many VideoProgress.

---

## 2. Profile

**Table:** `profiles`

| Attribute | Type | Nullable | Default | Description |
|-----------|------|----------|---------|-------------|
| user_id | UUID | No | — | PK and FK to `users.id`. |
| name | String | No | `""` | Display name. |
| avatar_url | String | Yes | — | Profile image URL. |
| bio | String | No | `""` | Short bio. |

**Constraints:** Primary key `user_id`; FK to `users(id)` ON DELETE CASCADE.

**Relations:** Belongs to one User (1:1).

---

## 3. Topic

**Table:** `topics`

| Attribute | Type | Nullable | Default | Description |
|-----------|------|----------|---------|-------------|
| id | UUID | No | `uuid()` | Primary key. |
| name | String | No | — | Human-readable name (e.g. "Machine Learning"). |
| slug | String | No | — | URL-safe identifier; unique. |

**Constraints:** `name` UNIQUE, `slug` UNIQUE.

**Relations:** Many Courses.

---

## 4. YoutubeChannel

**Table:** `youtube_channels`

| Attribute | Type | Nullable | Default | Description |
|-----------|------|----------|---------|-------------|
| id | UUID | No | `uuid()` | Primary key. |
| channel_id | String | No | — | YouTube channel ID; unique. |
| title | String | No | — | Channel display name. |
| verified | Boolean | No | `false` | YouTube verification flag. |
| language | String | No | `"en"` | Primary language. |

**Constraints:** `channel_id` UNIQUE.

**Relations:** Many Courses.

---

## 5. Course

**Table:** `courses`

| Attribute | Type | Nullable | Default | Description |
|-----------|------|----------|---------|-------------|
| id | UUID | No | `uuid()` | Primary key. |
| title | String | No | — | Course title (e.g. from first video). |
| description | String | No | `""` | Course description. |
| thumbnail | String | No | `""` | Thumbnail URL. |
| topic_id | UUID | No | — | FK to topics. |
| channel_id | UUID | No | — | FK to youtube_channels. |
| created_at | Timestamp | No | `now()` | When the course was created in our DB. |

**Constraints:** Foreign keys to `topics(id)` and `youtube_channels(id)`.

**Indexes:**

- `idx_courses_topic_created` — (topic_id, created_at DESC) for filtered listing.
- `idx_courses_channel` — (channel_id).
- `idx_courses_created_desc` — (created_at DESC) for global listing.

**Relations:** One Topic; one YoutubeChannel; many CourseVideos; many CourseAssessments; many VideoProgress.

---

## 6. CourseVideo

**Table:** `course_videos`

| Attribute | Type | Nullable | Default | Description |
|-----------|------|----------|---------|-------------|
| id | UUID | No | `uuid()` | Primary key. |
| course_id | UUID | No | — | FK to courses. |
| youtube_video_id | String | No | — | YouTube video ID. |
| title | String | No | — | Video title. |
| duration_seconds | Int | No | `0` | Length in seconds. |
| views | BigInt | No | `0` | View count (from API). |
| published_at | Timestamp | No | — | YouTube publish time. |
| position | Int | No | `0` | Order within the course. |

**Constraints:** UNIQUE (course_id, youtube_video_id); FK to `courses(id)` ON DELETE CASCADE.

**Indexes:** `idx_course_videos_course_pos` — (course_id, position) for ordered video list.

**Relations:** One Course; many VideoProgress; optional one VideoCache.

---

## 7. CourseAssessment

**Table:** `course_assessments`

| Attribute | Type | Nullable | Default | Description |
|-----------|------|----------|---------|-------------|
| id | UUID | No | `uuid()` | Primary key. |
| user_id | UUID | No | — | FK to users. |
| course_id | UUID | No | — | FK to courses. |
| rating | Int | Yes | — | 1–5 or null. |
| notes | String | No | `""` | User notes. |
| status | AssessmentStatus | No | `SAVED` | SAVED \| IN_PROGRESS \| COMPLETED \| ASSESSED. |
| created_at | Timestamp | No | `now()` | When saved/assessed. |

**Constraints:** UNIQUE (user_id, course_id); FKs to `users(id)` and `courses(id)` ON DELETE CASCADE.

**Indexes:**

- `idx_assessments_user_status` — (user_id, status, created_at DESC) for “My courses” and counts.
- `idx_assessments_course` — (course_id).

**Relations:** One User; one Course.

---

## 8. VideoProgress

**Table:** `video_progress`

| Attribute | Type | Nullable | Default | Description |
|-----------|------|----------|---------|-------------|
| id | UUID | No | `uuid()` | Primary key. |
| user_id | UUID | No | — | FK to users. |
| course_id | UUID | No | — | FK to courses. |
| video_id | UUID | No | — | FK to course_videos. |
| progress_percent | Int | No | `0` | 0–100 watch progress. |
| watched_at | Timestamp | No | `now()` | Last progress update. |

**Constraints:** UNIQUE (user_id, video_id); FKs to users, courses, course_videos ON DELETE CASCADE.

**Indexes:**

- `idx_progress_user_watched` — (user_id, watched_at DESC) for recent activity.
- `idx_progress_user_course` — (user_id, course_id).

**Relations:** One User; one Course; one CourseVideo.

---

## 9. VideoCache

**Table:** `video_cache`

| Attribute | Type | Nullable | Default | Description |
|-----------|------|----------|---------|-------------|
| video_id | UUID | No | — | PK and FK to course_videos.id. |
| data_json | JSON | No | — | Cached YouTube/metadata. |
| etag | String | No | `""` | For conditional requests. |
| last_fetched_at | Timestamp | No | `now()` | Cache refresh time. |

**Constraints:** Primary key `video_id`; FK to `course_videos(id)` ON DELETE CASCADE.

**Relations:** One CourseVideo.
