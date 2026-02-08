# Relationship Documentation

How entities in the Edu Courses database relate to each other.

---

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o| PROFILES : "has"
    USERS ||--o{ COURSE_ASSESSMENTS : "creates"
    USERS ||--o{ VIDEO_PROGRESS : "tracks"

    TOPICS ||--o{ COURSES : "categorizes"
    YOUTUBE_CHANNELS ||--o{ COURSES : "publishes"

    COURSES ||--o{ COURSE_VIDEOS : "contains"
    COURSES ||--o{ COURSE_ASSESSMENTS : "assessed in"
    COURSES ||--o{ VIDEO_PROGRESS : "progress in"

    COURSE_VIDEOS ||--o{ VIDEO_PROGRESS : "progress per"
    COURSE_VIDEOS ||--o| VIDEO_CACHE : "cached in"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        enum role
        timestamp created_at
        timestamp updated_at
    }

    PROFILES {
        uuid user_id PK,FK
        string name
        string avatar_url
        string bio
    }

    TOPICS {
        uuid id PK
        string name UK
        string slug UK
    }

    YOUTUBE_CHANNELS {
        uuid id PK
        string channel_id UK
        string title
        boolean verified
        string language
    }

    COURSES {
        uuid id PK
        string title
        string description
        uuid topic_id FK
        uuid channel_id FK
        timestamp created_at
    }

    COURSE_VIDEOS {
        uuid id PK
        uuid course_id FK
        string youtube_video_id
        string title
        int duration_seconds
        bigint views
        timestamp published_at
        int position
    }

    COURSE_ASSESSMENTS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        int rating
        string notes
        enum status
        timestamp created_at
    }

    VIDEO_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        uuid video_id FK
        int progress_percent
        timestamp watched_at
    }

    VIDEO_CACHE {
        uuid video_id PK,FK
        jsonb data_json
        string etag
        timestamp last_fetched_at
    }
```

---

## Relationship Summary

| From | To | Cardinality | Description |
|------|-----|-------------|-------------|
| **User** | Profile | 1 : 0..1 | One user has at most one profile (optional). |
| **User** | CourseAssessment | 1 : many | A user can save/assess many courses. |
| **User** | VideoProgress | 1 : many | A user has progress records for many videos. |
| **Topic** | Course | 1 : many | A topic groups many courses. |
| **YoutubeChannel** | Course | 1 : many | A channel is the source of many courses. |
| **Course** | CourseVideo | 1 : many | A course has many videos (playlist). |
| **Course** | CourseAssessment | 1 : many | A course can be saved/assessed by many users. |
| **Course** | VideoProgress | 1 : many | Progress rows reference the course. |
| **CourseVideo** | VideoProgress | 1 : many | Each video can have progress per user. |
| **CourseVideo** | VideoCache | 1 : 0..1 | Optional cache row per video. |

---

## Key Business Rules

1. **User ↔ Profile**  
   One-to-one optional. Profile is created with the user; deleting the user cascades to the profile.

2. **User ↔ Course (via CourseAssessment)**  
   A user can save/assess a course only once: unique `(user_id, course_id)`.  
   “My courses” = all CourseAssessments for that user.

3. **User ↔ Video (via VideoProgress)**  
   One progress row per user per video: unique `(user_id, video_id)`.  
   Used for watch percentage and “recent activity”.

4. **Course ↔ Topic / Channel**  
   Every course has exactly one topic and one YouTube channel.  
   Topic and channel are shared across courses (same topic/channel can have many courses).

5. **Course ↔ CourseVideo**  
   One-to-many; order by `position`.  
   Unique `(course_id, youtube_video_id)` so the same YouTube video is not duplicated in one course.

6. **Cascade deletes**  
   - Delete User → Profile, CourseAssessments, VideoProgress for that user.  
   - Delete Course → CourseVideos, CourseAssessments, VideoProgress for that course.  
   - Delete CourseVideo → VideoProgress, VideoCache for that video.

---

## Navigation Paths (for queries)

| Use case | Path |
|----------|------|
| Current user’s profile | User → Profile |
| “My courses” list | User → CourseAssessment → Course (+ Topic, Channel, video count) |
| Course detail + videos | Course → Topic, Channel, CourseVideo (ordered by position) |
| Dashboard stats | User → count(CourseAssessment), count by status, aggregate(VideoProgress), recent VideoProgress → Video, Course |
| Platform stats | Count Courses, Topics, Users; Topic with course count (top topics) |
