# Backend Development Task — FastAPI Endpoints

## ScriptPal — Autism Support Application for Children

**Document Version:** 2.0
**Date:** April 10, 2026
**Prepared by:** Project Manager
**Status:** Ready for Development

---

## Objective

Develop and deploy RESTful APIs using **FastAPI** for the **ScriptPal** application — a communication and progress tracking tool designed for children with autism and their caregivers. The APIs must serve all screens identified in the Figma designs (Home Dashboard, Add New Script, Progress, Library, Activity, and Reports).

> **IMPORTANT:** Authentication and Authorization modules are **already completed**. Do NOT implement auth endpoints (`/auth/login`, `/auth/register`, `/auth/refresh`, etc.). All endpoints below assume the user is authenticated. Use the existing auth middleware to extract `user_id` from the JWT token in request headers.

---

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Framework   | FastAPI (Python 3.11+)  |
| Database    | SQLite                   |
| ORM         | SQLAlchemy              |
| Migrations  | Alembic                 |
| Validation  | Pydantic v2             |
| Testing     | pytest + httpx          |
| Docs        | Auto-generated Swagger at `/docs` |

---

## Database Models

Below are the core entities derived from the Figma screens. Each model maps to a **SQLite table**. Add appropriate foreign keys, indexes, and constraints.

> **SQLite-Specific Notes:**
> - SQLite does **not** have native `UUID` or `ENUM` types. Use `TEXT` for UUID columns and `VARCHAR` with Python-side `Enum` validation via Pydantic/SQLAlchemy for enum fields.
> - SQLite `BOOLEAN` is stored as `INTEGER` (0/1) — SQLAlchemy handles this transparently.
> - SQLite uses `DATETIME` (TEXT in ISO 8601 format) for timestamps.
> - For UUID primary keys, generate them in Python using `uuid.uuid4()` before inserting.
> - Use `aiosqlite` if async database access is needed, otherwise standard synchronous SQLAlchemy is recommended for simplicity.

### 1. `users` (already exists from auth module)

| Column           | Type          | Notes                          |
|------------------|---------------|--------------------------------|
| id               | TEXT (PK)     | UUID string, Primary key       |
| username         | VARCHAR       |                            |
| email            | VARCHAR       | Unique                     |
| role             | ENUM          | parent, therapist, admin   |
| child_name       | VARCHAR       | e.g., "Emma"               |
| child_age        | INTEGER       |                            |
| created_at       | TIMESTAMP     |                            |
| updated_at       | TIMESTAMP     |                            |

### 2. `scripts`

Represents a communication "script" — a verbalization or expression documented by the caregiver.

| Column              | Type          | Notes                                  |
|---------------------|---------------|----------------------------------------|
| id                  | TEXT (PK)     | UUID string, Primary key              |
| user_id             | TEXT (FK)     | UUID string, Reference to `users.id` |
| script_text         | TEXT          | The child's exact words                |
| context             | ENUM          | home, school, car, bedtime             |
| emotional_state     | ENUM          | happy, sad, angry, anxious, excited, neutral |
| source              | ENUM          | tv, song, parent, school, unknown      |
| frequency           | ENUM          | new, repeated, variation               |
| meaning             | TEXT          | Caregiver's interpretation             |
| notes               | TEXT          | Additional observations                |
| created_at          | TIMESTAMP     |                                        |
| updated_at          | TIMESTAMP     |                                        |

### 3. `daily_suggestions`

| Column        | Type          | Notes                     |
|---------------|---------------|---------------------------|
| id            | TEXT (PK)     | UUID string                |
| text          | TEXT          | Suggestion text           |
| activity_name | VARCHAR       | e.g., "Let's play together" |
| icon_url      | VARCHAR       | Illustration URL          |
| active        | BOOLEAN       |                           |

### 4. `milestones`

| Column       | Type      | Notes                         |
|--------------|-----------|-------------------------------|
| id           | TEXT (PK) | UUID string                    |
| user_id      | TEXT (FK) | UUID string, Reference to `users.id` |
| title        | TEXT      | e.g., "First two-word phrase" |
| icon         | VARCHAR   | Icon identifier              |
| achieved_on  | DATE      | Date of achievement           |

### 5. `library_resources`

Predefined scripts and response templates from the Library screen.

| Column            | Type          | Notes                                  |
|-------------------|---------------|----------------------------------------|
| id                | TEXT (PK)     | UUID string                             |
| title             | VARCHAR       | e.g., "Requesting Items"               |
| description       | TEXT          | e.g., "You want [item]! Let me help..." |
| category          | ENUM          | emotions, routines, social, communication |
| age_group         | VARCHAR       | e.g., "2-3 years", "3-4 years", "All Ages" |
| avatar_url        | VARCHAR       | Resource avatar/thumbnail              |

### 6. `activities`

Interactive activities for children (Activity screen).

| Column            | Type          | Notes                          |
|-------------------|---------------|--------------------------------|
| id                | TEXT (PK)     | UUID string                     |
| title             | VARCHAR       | e.g., "Bird Nest Rescue"       |
| description       | TEXT          | Activity description           |
| image_url         | VARCHAR       | Activity illustration URL      |
| age_range         | VARCHAR       | e.g., "3–6 yrs"                |
| stage             | VARCHAR       | e.g., "Stage 1–2"              |
| play_duration     | VARCHAR       | e.g., "15-20 min play"         |
| category          | VARCHAR       |                                |

### 7. `activity_logs`

Tracks when a user starts/completes an activity.

| Column        | Type      | Notes                    |
|---------------|-----------|--------------------------|
| id            | TEXT (PK) | UUID string               |
| user_id       | TEXT (FK) | UUID string               |
| activity_id   | TEXT (FK) | UUID string               |
| status        | ENUM      | started, completed       |
| started_at    | TIMESTAMP |                          |
| completed_at  | TIMESTAMP |                          |

### 8. `reports`

Generated communication progress reports.

| Column        | Type      | Notes                             |
|---------------|-----------|-----------------------------------|
| id            | TEXT (PK) | UUID string                         |
| user_id       | TEXT (FK) | UUID string                         |
| title         | VARCHAR   | e.g., "Communication Progress Report" |
| period_type   | ENUM      | week, month, quarter              |
| start_date    | DATE      |                                   |
| end_date      | DATE      |                                   |
| total_scripts | INTEGER   |                                   |
| positive_pct  | FLOAT     | Positive emotions percentage      |
| growth_rate   | FLOAT     |                                   |
| new_milestones| INTEGER   |                                   |
| generated_at  | TIMESTAMP |                                   |

### 9. `report_schedules`

| Column      | Type      | Notes                          |
|-------------|-----------|--------------------------------|
| id          | TEXT (PK) | UUID string                      |
| user_id     | TEXT (FK) | UUID string                      |
| frequency   | ENUM      | weekly, monthly                |
| email       | VARCHAR   | Recipient email                |
| active      | BOOLEAN   |                                |
| created_at  | TIMESTAMP |                                |

---

## API Endpoints

All endpoints below are prefixed with `/api/v1`. The auth middleware will inject `user_id` from the JWT token. All responses follow a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses follow:
```json
{
  "success": false,
  "error": "Error description",
  "error_code": "ERROR_CODE"
}
```

---

## Module 1: Home Dashboard

### `GET /api/v1/dashboard`

Returns all data needed to render the Home/Dashboard screen from Figma.

**Description:** Fetches the personalized greeting, daily suggestion, recent scripts (with timestamps), weekly insight metrics, and the most-repeated script pattern. This is the primary landing endpoint after login.

**Query Parameters:** None

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "greeting": {
      "message": "Good Morning",
      "sub_message": "Let's support Emma today",
      "child_name": "Emma"
    },
    "daily_suggestion": {
      "id": "uuid-string",
      "text": "Try this today: 'Let's play together.'",
      "activity_name": "Let's play together",
      "icon_url": "https://cdn.example.com/illustrations/play-together.png"
    },
    "recent_scripts": [
      {
        "id": "uuid-string",
        "script_text": "Want juice want juice",
        "emotional_state": "happy",
        "created_at": "2026-04-10T15:12:00Z",
        "time_ago": "2 hours ago"
      },
      {
        "id": "uuid-string",
        "script_text": "Want juice want juice",
        "emotional_state": "neutral",
        "created_at": "2026-04-10T12:30:00Z",
        "time_ago": "5 hours ago"
      }
    ],
    "weekly_insight": {
      "scripts_this_week": 12,
      "most_repeated": "Want juice",
      "pattern_found": "Evenings show more overwhelm scripts than mornings. Consider adding sensory breaks at 5 PM."
    },
    "unread_notifications": 3
  },
  "message": "Dashboard loaded successfully"
}
```

---

### `GET /api/v1/dashboard/notification-count`

Returns the count of unread notifications for the badge on the notification bell icon.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "unread_count": 3
  }
}
```

---

## Module 2: Scripts (Add / View / Edit / Delete)

### `POST /api/v1/scripts`

Creates a new communication script. Maps directly to the "Add New Script" screen in Figma.

**Description:** Accepts the child's verbalization along with contextual metadata — the situation/context in which it occurred, the child's emotional state, the source of the script, whether it's a new/repeated/variation, the caregiver's interpretation of its meaning, and any additional notes. Supports voice-to-text input (the frontend sends the transcribed text in `script_text`).

**Request Body:**

```json
{
  "script_text": "Want juice want juice",
  "context": "home",
  "emotional_state": "happy",
  "source": "tv",
  "frequency": "repeated",
  "meaning": "Child is requesting a drink",
  "notes": "Happened after watching a cartoon with juice"
}
```

**Field Validations:**

| Field             | Type   | Required | Validation                                   |
|-------------------|--------|----------|----------------------------------------------|
| script_text       | string | Yes      | Min 1 char, Max 2000 chars                   |
| context           | enum   | Yes      | One of: home, school, car, bedtime           |
| emotional_state   | enum   | Yes      | One of: happy, sad, angry, anxious, excited, neutral |
| source            | enum   | Yes      | One of: tv, song, parent, school, unknown    |
| frequency         | enum   | Yes      | One of: new, repeated, variation             |
| meaning           | string | No       | Max 3000 chars                               |
| notes             | string | No       | Max 3000 chars                               |

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "script_text": "Want juice want juice",
    "context": "home",
    "emotional_state": "happy",
    "source": "tv",
    "frequency": "repeated",
    "meaning": "Child is requesting a drink",
    "notes": "Happened after watching a cartoon with juice",
    "created_at": "2026-04-10T15:30:00Z",
    "updated_at": "2026-04-10T15:30:00Z"
  },
  "message": "Script created successfully"
}
```

---

### `GET /api/v1/scripts`

Retrieves a paginated list of the user's scripts. Used by the "Recent Scripts" section and the "See All" scripts list.

**Query Parameters:**

| Parameter       | Type    | Default | Description                              |
|-----------------|---------|---------|------------------------------------------|
| page            | integer | 1       | Page number                              |
| page_size       | integer | 20      | Items per page (max 100)                 |
| context         | string  | null    | Filter by context                        |
| emotional_state | string  | null    | Filter by emotional state                |
| frequency       | string  | null    | Filter by frequency                      |
| sort_by         | string  | created_at | Field to sort by                      |
| sort_order      | string  | desc    | asc or desc                              |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "scripts": [
      {
        "id": "uuid-string",
        "script_text": "Want juice want juice",
        "context": "home",
        "emotional_state": "happy",
        "source": "tv",
        "frequency": "repeated",
        "meaning": "Child is requesting a drink",
        "notes": "Happened after watching a cartoon with juice",
        "created_at": "2026-04-10T15:30:00Z",
        "time_ago": "2 hours ago"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 45,
      "total_pages": 3
    }
  }
}
```

---

### `GET /api/v1/scripts/{script_id}`

Retrieves a single script by its ID. Used when the user taps "Edit" on a recent script card.

**Path Parameters:**

| Parameter  | Type | Description       |
|------------|------|-------------------|
| script_id  | UUID | Script identifier |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "user_id": "uuid-string",
    "script_text": "Want juice want juice",
    "context": "home",
    "emotional_state": "happy",
    "source": "tv",
    "frequency": "repeated",
    "meaning": "Child is requesting a drink",
    "notes": "Happened after watching a cartoon with juice",
    "created_at": "2026-04-10T15:30:00Z",
    "updated_at": "2026-04-10T15:30:00Z"
  }
}
```

**Response `404 Not Found`:**

```json
{
  "success": false,
  "error": "Script not found",
  "error_code": "SCRIPT_NOT_FOUND"
}
```

---

### `PUT /api/v1/scripts/{script_id}`

Updates an existing script. Used when editing a script from the "Edit" icon on the Recent Scripts cards.

**Path Parameters:**

| Parameter  | Type | Description       |
|------------|------|-------------------|
| script_id  | UUID | Script identifier |

**Request Body:** Same schema as `POST /api/v1/scripts` (all fields optional for partial update).

```json
{
  "script_text": "Want juice want juice please",
  "emotional_state": "excited",
  "notes": "Added 'please' this time"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "script_text": "Want juice want juice please",
    "context": "home",
    "emotional_state": "excited",
    "source": "tv",
    "frequency": "variation",
    "meaning": "Child is requesting a drink",
    "notes": "Added 'please' this time",
    "created_at": "2026-04-10T15:30:00Z",
    "updated_at": "2026-04-10T16:00:00Z"
  },
  "message": "Script updated successfully"
}
```

---

### `DELETE /api/v1/scripts/{script_id}`

Deletes a script by its ID.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": null,
  "message": "Script deleted successfully"
}
```

---

## Module 3: Progress & Analytics

This module powers the **Progress screen** from Figma, which has three tabs: **Weekly**, **Emotions**, and **Trends**.

### `GET /api/v1/progress/summary`

Returns the top-level summary metrics displayed as the three circular cards on the Progress screen: total scripts, growth rate, and positive emotion percentage.

**Query Parameters:**

| Parameter   | Type   | Default | Description                    |
|-------------|--------|---------|--------------------------------|
| period      | string | week    | week, month, quarter           |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "total_scripts": 27,
    "growth_rate": 18.0,
    "positive_emotions_pct": 82.0
  }
}
```

---

### `GET /api/v1/progress/weekly`

Returns data for the **Weekly tab** on the Progress screen. Includes the bar chart data (scripts per day of the week) and the recent milestones list.

**Description:** Computes the number of scripts logged for each day of the current week (Monday through Sunday). The frontend uses this data to render the pink bar chart. Also returns the three most recent milestones achieved by the user's child.

**Query Parameters:** None

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "chart": {
      "title": "Scripts This Week",
      "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      "values": [6, 4, 6, 5, 7, 5, 6]
    },
    "recent_milestones": [
      {
        "id": "uuid-string",
        "title": "First two-word phrase",
        "icon": "party_popper",
        "achieved_on": "2026-03-15"
      },
      {
        "id": "uuid-string",
        "title": "Used 'please' independently",
        "icon": "star",
        "achieved_on": "2026-03-12"
      },
      {
        "id": "uuid-string",
        "title": "Maintained eye contact during conversation",
        "icon": "eye",
        "achieved_on": "2026-03-10"
      }
    ]
  }
}
```

---

### `GET /api/v1/progress/emotions`

Returns data for the **Emotions tab** on the Progress screen. Includes the horizontal bar chart showing emotional pattern distribution and the recent milestones list.

**Description:** Aggregates all scripts from the current period and groups them by `emotional_state` to show how often each emotion was recorded. The frontend renders this as a horizontal bar chart. Also returns recent milestones (same data as the weekly tab).

**Query Parameters:**

| Parameter   | Type   | Default | Description                    |
|-------------|--------|---------|--------------------------------|
| period      | string | week    | week, month, quarter           |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "chart": {
      "title": "Emotional Patterns",
      "labels": ["Happy", "Excited", "Neutral", "Sad", "Anxious", "Angry"],
      "values": [6, 4, 6, 5, 7, 2]
    },
    "recent_milestones": [
      {
        "id": "uuid-string",
        "title": "First two-word phrase",
        "icon": "party_popper",
        "achieved_on": "2026-03-15"
      },
      {
        "id": "uuid-string",
        "title": "Used 'please' independently",
        "icon": "star",
        "achieved_on": "2026-03-12"
      },
      {
        "id": "uuid-string",
        "title": "Maintained eye contact during conversation",
        "icon": "eye",
        "achieved_on": "2026-03-10"
      }
    ]
  }
}
```

---

### `GET /api/v1/progress/trends`

Returns data for the **Trends tab** on the Progress screen. Shows long-term progress trends over multiple weeks/months.

**Description:** Aggregates script counts, emotional distributions, and growth rates over a configurable number of past periods. Used to identify long-term patterns and improvements.

**Query Parameters:**

| Parameter   | Type    | Default | Description                               |
|-------------|---------|---------|-------------------------------------------|
| period      | string  | month   | week, month, quarter                      |
| periods     | integer | 6       | Number of past periods to include         |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "chart": {
      "title": "Progress Trends",
      "labels": ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
      "scripts": [15, 18, 20, 22, 25, 27],
      "positive_pct": [65, 70, 72, 78, 80, 82],
      "growth_rate": [5, 8, 10, 12, 15, 18]
    }
  }
}
```

---

### `POST /api/v1/milestones`

Creates a new milestone. This may be triggered automatically by the system when certain patterns are detected, or manually by the caregiver.

**Request Body:**

```json
{
  "title": "First two-word phrase",
  "icon": "party_popper",
  "achieved_on": "2026-03-15"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "user_id": "uuid-string",
    "title": "First two-word phrase",
    "icon": "party_popper",
    "achieved_on": "2026-03-15"
  },
  "message": "Milestone created successfully"
}
```

---

### `GET /api/v1/milestones`

Retrieves all milestones for the authenticated user, ordered by `achieved_on` descending.

**Query Parameters:**

| Parameter  | Type    | Default | Description                          |
|------------|---------|---------|--------------------------------------|
| page       | integer | 1       | Page number                          |
| page_size  | integer | 20      | Items per page                       |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "milestones": [
      {
        "id": "uuid-string",
        "title": "First two-word phrase",
        "icon": "party_popper",
        "achieved_on": "2026-03-15"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 12,
      "total_pages": 1
    }
  }
}
```

---

## Module 4: Reports

This module powers the **Activity/Reports screen** from Figma, which shows communication progress reports with the ability to generate PDFs, share via email, schedule recurring reports, and download previous reports.

### `GET /api/v1/reports/current`

Returns the current communication progress report data. This is the main card shown on the Reports screen.

**Description:** Computes the total scripts, positive emotions percentage, growth rate, and new milestones count for the specified time period. Returns report metadata along with computed metrics.

**Query Parameters:**

| Parameter    | Type   | Default | Description                          |
|--------------|--------|---------|--------------------------------------|
| period_type  | string | week    | One of: week, month, quarter         |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "Communication Progress Report",
    "start_date": "2026-03-12",
    "end_date": "2026-03-19",
    "period_type": "week",
    "metrics": {
      "total_scripts": 27,
      "positive_emotions_pct": 82.0,
      "growth_rate": 18.0,
      "new_milestones": 3
    },
    "generated_at": "2026-04-10T15:13:00Z"
  }
}
```

---

### `POST /api/v1/reports/generate`

Generates a PDF report for the specified period and saves it. Returns the report record.

**Description:** Triggers report generation for the given time period. The backend should compute all metrics, render a PDF (using a library like `reportlab` or `weasyprint`), store the PDF file (e.g., on S3 or local storage), and create a `reports` database record.

**Request Body:**

```json
{
  "period_type": "week",
  "start_date": "2026-03-12",
  "end_date": "2026-03-19"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "Communication Progress Report",
    "period_type": "week",
    "start_date": "2026-03-12",
    "end_date": "2026-03-19",
    "total_scripts": 27,
    "positive_pct": 82.0,
    "growth_rate": 18.0,
    "new_milestones": 3,
    "pdf_url": "https://cdn.example.com/reports/report-uuid.pdf",
    "generated_at": "2026-04-10T15:15:00Z"
  },
  "message": "Report generated successfully"
}
```

---

### `POST /api/v1/reports/{report_id}/share-email`

Shares a generated report via email to a therapist or school.

**Description:** Sends the report PDF as an email attachment to the specified recipient. The email should contain the report summary and a link to download the full PDF.

**Path Parameters:**

| Parameter  | Type | Description       |
|------------|------|-------------------|
| report_id  | UUID | Report identifier |

**Request Body:**

```json
{
  "email": "therapist@example.com",
  "message": "Here is Emma's weekly progress report."
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "report_id": "uuid-string",
    "sent_to": "therapist@example.com",
    "sent_at": "2026-04-10T15:20:00Z"
  },
  "message": "Report emailed successfully"
}
```

---

### `GET /api/v1/reports/schedules`

Returns the current report scheduling configuration for the user.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "uuid-string",
        "frequency": "weekly",
        "email": "therapist@example.com",
        "active": true,
        "created_at": "2026-04-01T10:00:00Z"
      }
    ]
  }
}
```

---

### `POST /api/v1/reports/schedules`

Creates a new recurring report schedule. The system will automatically generate and email reports at the specified frequency.

**Request Body:**

```json
{
  "frequency": "weekly",
  "email": "therapist@example.com"
}
```

**Field Validations:**

| Field     | Type   | Required | Validation                                 |
|-----------|--------|----------|--------------------------------------------|
| frequency | enum   | Yes      | One of: weekly, monthly                    |
| email     | string | Yes      | Valid email format                         |

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "frequency": "weekly",
    "email": "therapist@example.com",
    "active": true,
    "created_at": "2026-04-10T15:25:00Z"
  },
  "message": "Report schedule created successfully"
}
```

---

### `PUT /api/v1/reports/schedules/{schedule_id}`

Updates an existing report schedule (toggle active/inactive, change frequency or email).

**Request Body:**

```json
{
  "frequency": "monthly",
  "email": "school@example.com",
  "active": true
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "frequency": "monthly",
    "email": "school@example.com",
    "active": true
  },
  "message": "Schedule updated successfully"
}
```

---

### `DELETE /api/v1/reports/schedules/{schedule_id}`

Cancels a recurring report schedule.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": null,
  "message": "Schedule deleted successfully"
}
```

---

### `GET /api/v1/reports/history`

Returns a paginated list of previously generated reports. Shown in the "Previous Reports" section of the Reports screen.

**Query Parameters:**

| Parameter  | Type    | Default | Description             |
|------------|---------|---------|-------------------------|
| page       | integer | 1       | Page number             |
| page_size  | integer | 10      | Items per page          |
| period_type| string  | null    | Filter by period type   |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid-string",
        "title": "Week of March 12",
        "period_type": "week",
        "start_date": "2026-03-12",
        "end_date": "2026-03-19",
        "generated_at": "2026-04-10T15:13:00Z",
        "pdf_url": "https://cdn.example.com/reports/report-uuid.pdf",
        "total_scripts": 27,
        "positive_pct": 82.0,
        "growth_rate": 18.0,
        "new_milestones": 3
      },
      {
        "id": "uuid-string",
        "title": "Week of March 5",
        "period_type": "week",
        "start_date": "2026-03-05",
        "end_date": "2026-03-12",
        "generated_at": "2026-04-03T09:00:00Z",
        "pdf_url": "https://cdn.example.com/reports/report-uuid2.pdf",
        "total_scripts": 22,
        "positive_pct": 78.0,
        "growth_rate": 15.0,
        "new_milestones": 1
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total_items": 8,
      "total_pages": 1
    }
  }
}
```

---

### `GET /api/v1/reports/{report_id}/download`

Returns a presigned URL or redirect to download the PDF of a specific report.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "download_url": "https://cdn.example.com/reports/report-uuid.pdf?signature=...",
    "expires_at": "2026-04-10T16:00:00Z"
  }
}
```

---

## Module 5: Library

This module powers the **Library screen** from Figma, which displays predefined response resources organized by category and age group.

### `GET /api/v1/library`

Retrieves a paginated list of library resources. Supports search and filtering by category and age group.

**Description:** Returns predefined scripts and response templates that caregivers can browse. Each resource card shows the title, a sample response phrase, a category tag, and an age group tag. The frontend renders these as scrollable cards.

**Query Parameters:**

| Parameter   | Type   | Default | Description                                        |
|-------------|--------|---------|----------------------------------------------------|
| page        | integer| 1       | Page number                                        |
| page_size   | integer| 20      | Items per page (max 100)                           |
| search      | string | null    | Search in title and description                    |
| category    | string | null    | Filter: emotions, routines, social, communication  |
| age_group   | string | null    | Filter: "2-3 years", "3-4 years", "All Ages", etc. |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "uuid-string",
        "title": "Requesting Items",
        "description": "You want [item]! Let me help you get it.",
        "category": "communication",
        "age_group": "2-3 years",
        "avatar_url": "https://cdn.example.com/avatars/requesting.png"
      },
      {
        "id": "uuid-string",
        "title": "Expressing Frustration",
        "description": "I see you're frustrated. Let's take a deep breath together.",
        "category": "emotions",
        "age_group": "3-4 years",
        "avatar_url": "https://cdn.example.com/avatars/frustration.png"
      },
      {
        "id": "uuid-string",
        "title": "Morning Routine",
        "description": "Good morning! It's time to start our day.",
        "category": "routines",
        "age_group": "All Ages",
        "avatar_url": "https://cdn.example.com/avatars/morning.png"
      },
      {
        "id": "uuid-string",
        "title": "Sharing Toys",
        "description": "Can we share? Let's take turns with the toy.",
        "category": "social",
        "age_group": "3-4 years",
        "avatar_url": "https://cdn.example.com/avatars/sharing.png"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 48,
      "total_pages": 3
    },
    "filters": {
      "available_categories": ["emotions", "routines", "social", "communication"],
      "available_age_groups": ["2-3 years", "3-4 years", "4-6 years", "All Ages"]
    }
  }
}
```

---

### `GET /api/v1/library/{resource_id}`

Retrieves the full details of a single library resource. Used when the user taps "View Details" on a library card.

**Path Parameters:**

| Parameter    | Type | Description          |
|--------------|------|----------------------|
| resource_id  | UUID | Library resource ID  |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "Requesting Items",
    "description": "You want [item]! Let me help you get it.",
    "full_content": "When your child wants something, model the correct way to request it. Use visual supports if needed. Encourage them to point, use a picture card, or attempt verbalization before giving the item.",
    "category": "communication",
    "age_group": "2-3 years",
    "avatar_url": "https://cdn.example.com/avatars/requesting.png",
    "tips": [
      "Wait 5-10 seconds before prompting",
      "Use visual cue cards",
      "Praise any communication attempt"
    ]
  }
}
```

---

## Module 6: Activities

This module powers the **Activity screen** from Figma, which displays a list of interactive activities that caregivers can browse and start with their children.

### `GET /api/v1/activities`

Retrieves a paginated list of available activities. Supports search and filtering by age range, stage, and category.

**Description:** Returns interactive activities designed for children with autism. Each activity card includes an image, title, description, age range, developmental stage, and estimated play duration. The frontend displays these as scrollable cards with a "Start" button.

**Query Parameters:**

| Parameter   | Type   | Default | Description                                |
|-------------|--------|---------|--------------------------------------------|
| page        | integer| 1       | Page number                                |
| page_size   | integer| 20      | Items per page (max 100)                   |
| search      | string | null    | Search in title and description            |
| age_range   | string | null    | Filter: "2-4 yrs", "3-6 yrs", "4-6 yrs", "6+ yrs" |
| stage       | string | null    | Filter: "Stage 1", "Stage 1-2", "Stage 2", "Stage 3+" |
| category    | string | null    | Filter by activity category                |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid-string",
        "title": "Bird Nest Rescue",
        "description": "Help the mama bird find her lost eggs using gentle movements",
        "image_url": "https://cdn.example.com/activities/bird-nest.png",
        "age_range": "3-6 yrs",
        "stage": "Stage 1-2",
        "play_duration": "15-20 min play",
        "category": "motor_skills"
      },
      {
        "id": "uuid-string",
        "title": "Rainbow Sorting",
        "description": "Sort colored objects into matching rainbow bins",
        "image_url": "https://cdn.example.com/activities/rainbow.png",
        "age_range": "2-4 yrs",
        "stage": "Stage 1",
        "play_duration": "10-15 min play",
        "category": "cognitive"
      },
      {
        "id": "uuid-string",
        "title": "Moonlit Forest Adventure",
        "description": "Explore a calming nighttime forest with sensory-friendly sounds",
        "image_url": "https://cdn.example.com/activities/moonlit-forest.png",
        "age_range": "4-6 yrs",
        "stage": "Stage 2",
        "play_duration": "20-30 min play",
        "category": "sensory"
      },
      {
        "id": "uuid-string",
        "title": "Garden Play",
        "description": "Plant seeds and watch them grow in a virtual garden",
        "image_url": "https://cdn.example.com/activities/garden.png",
        "age_range": "6+ yrs",
        "stage": "Stage 3+",
        "play_duration": "25-30 min play",
        "category": "social"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 35,
      "total_pages": 2
    },
    "filters": {
      "available_age_ranges": ["2-4 yrs", "3-6 yrs", "4-6 yrs", "6+ yrs"],
      "available_stages": ["Stage 1", "Stage 1-2", "Stage 2", "Stage 3+"],
      "available_categories": ["motor_skills", "cognitive", "sensory", "social"]
    }
  }
}
```

---

### `GET /api/v1/activities/{activity_id}`

Retrieves full details of a single activity. Used when the user taps "Start" or wants more details.

**Path Parameters:**

| Parameter    | Type | Description          |
|--------------|------|----------------------|
| activity_id  | UUID | Activity identifier  |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "Bird Nest Rescue",
    "description": "Help the mama bird find her lost eggs using gentle movements",
    "full_instructions": "1. Show the child the mama bird illustration.\n2. Explain that the eggs are lost.\n3. Guide the child to use gentle hand movements to 'find' the eggs.\n4. Celebrate when each egg is found.\n5. Count the eggs together at the end.",
    "image_url": "https://cdn.example.com/activities/bird-nest.png",
    "age_range": "3-6 yrs",
    "stage": "Stage 1-2",
    "play_duration": "15-20 min play",
    "category": "motor_skills",
    "materials_needed": ["Printed bird illustration", "Small egg-shaped objects"],
    "learning_goals": ["Fine motor skills", "Following instructions", "Turn-taking"]
  }
}
```

---

### `POST /api/v1/activity-logs`

Logs the start or completion of an activity session.

**Description:** When a user taps "Start" on an activity, the frontend should call this endpoint with `status: "started"`. When the activity is completed, call again with `status: "completed"`. This tracks activity engagement over time.

**Request Body:**

```json
{
  "activity_id": "uuid-string",
  "status": "started"
}
```

**Field Validations:**

| Field        | Type | Required | Validation                           |
|--------------|------|----------|--------------------------------------|
| activity_id  | UUID | Yes      | Must be a valid activity UUID        |
| status       | enum | Yes      | One of: started, completed           |

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "user_id": "uuid-string",
    "activity_id": "uuid-string",
    "status": "started",
    "started_at": "2026-04-10T15:30:00Z",
    "completed_at": null
  },
  "message": "Activity log created"
}
```

---

### `GET /api/v1/activity-logs`

Retrieves the authenticated user's activity log history.

**Query Parameters:**

| Parameter  | Type    | Default | Description               |
|------------|---------|---------|---------------------------|
| page       | integer | 1       | Page number               |
| page_size  | integer | 20      | Items per page            |
| status     | string  | null    | Filter: started, completed|

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid-string",
        "activity_id": "uuid-string",
        "activity_title": "Bird Nest Rescue",
        "status": "completed",
        "started_at": "2026-04-10T15:30:00Z",
        "completed_at": "2026-04-10T15:48:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 15,
      "total_pages": 1
    }
  }
}
```

---

## Module 7: Notifications

### `GET /api/v1/notifications`

Retrieves a paginated list of notifications for the authenticated user.

**Query Parameters:**

| Parameter  | Type    | Default | Description         |
|------------|---------|---------|---------------------|
| page       | integer | 1       | Page number         |
| page_size  | integer | 20      | Items per page      |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid-string",
        "type": "milestone",
        "title": "New Milestone Achieved!",
        "message": "Emma achieved: 'First two-word phrase'",
        "read": false,
        "created_at": "2026-03-15T10:00:00Z"
      },
      {
        "id": "uuid-string",
        "type": "report",
        "title": "Weekly Report Ready",
        "message": "Your weekly communication progress report is ready to view.",
        "read": true,
        "created_at": "2026-03-12T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 8,
      "total_pages": 1
    }
  }
}
```

---

### `PUT /api/v1/notifications/{notification_id}/read`

Marks a notification as read.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": null,
  "message": "Notification marked as read"
}
```

---

## Module 8: User Profile (Minimal)

### `GET /api/v1/profile`

Returns the authenticated user's profile information. Used for the profile avatar and settings.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "username": "Monish",
    "email": "monish@example.com",
    "role": "parent",
    "child_name": "Emma",
    "child_age": 4,
    "avatar_url": "https://cdn.example.com/avatars/user-uuid.png",
    "created_at": "2026-01-15T10:00:00Z"
  }
}
```

---

### `PUT /api/v1/profile`

Updates the authenticated user's profile (child name, child age, avatar, etc.).

**Request Body:**

```json
{
  "child_name": "Emma",
  "child_age": 5,
  "avatar_url": "https://cdn.example.com/avatars/new-avatar.png"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "username": "Monish",
    "email": "monish@example.com",
    "role": "parent",
    "child_name": "Emma",
    "child_age": 5,
    "avatar_url": "https://cdn.example.com/avatars/new-avatar.png"
  },
  "message": "Profile updated successfully"
}
```

---

## Complete Endpoint Summary Table

| #  | Method | Endpoint                                          | Module      | Description                              |
|----|--------|----------------------------------------------------|-------------|------------------------------------------|
| 1  | GET    | `/api/v1/dashboard`                                | Dashboard   | Home screen data (greeting, suggestions, recent scripts, insights) |
| 2  | GET    | `/api/v1/dashboard/notification-count`              | Dashboard   | Unread notification count for badge      |
| 3  | POST   | `/api/v1/scripts`                                  | Scripts     | Create a new communication script        |
| 4  | GET    | `/api/v1/scripts`                                  | Scripts     | List scripts (paginated, filterable)     |
| 5  | GET    | `/api/v1/scripts/{script_id}`                      | Scripts     | Get single script details                |
| 6  | PUT    | `/api/v1/scripts/{script_id}`                      | Scripts     | Update a script                          |
| 7  | DELETE | `/api/v1/scripts/{script_id}`                      | Scripts     | Delete a script                          |
| 8  | GET    | `/api/v1/progress/summary`                         | Progress    | Summary metrics (scripts count, growth, positive %) |
| 9  | GET    | `/api/v1/progress/weekly`                          | Progress    | Weekly chart data + recent milestones    |
| 10 | GET    | `/api/v1/progress/emotions`                        | Progress    | Emotional patterns chart + milestones    |
| 11 | GET    | `/api/v1/progress/trends`                          | Progress    | Long-term progress trends                |
| 12 | POST   | `/api/v1/milestones`                               | Progress    | Create a new milestone                   |
| 13 | GET    | `/api/v1/milestones`                               | Progress    | List all milestones                      |
| 14 | GET    | `/api/v1/reports/current`                          | Reports     | Current period report data               |
| 15 | POST   | `/api/v1/reports/generate`                         | Reports     | Generate a PDF report                    |
| 16 | POST   | `/api/v1/reports/{report_id}/share-email`          | Reports     | Share report via email                   |
| 17 | GET    | `/api/v1/reports/schedules`                        | Reports     | List report schedules                    |
| 18 | POST   | `/api/v1/reports/schedules`                        | Reports     | Create a report schedule                 |
| 19 | PUT    | `/api/v1/reports/schedules/{schedule_id}`          | Reports     | Update a report schedule                 |
| 20 | DELETE | `/api/v1/reports/schedules/{schedule_id}`          | Reports     | Delete a report schedule                 |
| 21 | GET    | `/api/v1/reports/history`                          | Reports     | List previous reports                    |
| 22 | GET    | `/api/v1/reports/{report_id}/download`             | Reports     | Get report PDF download URL              |
| 23 | GET    | `/api/v1/library`                                  | Library     | List library resources (search, filter)  |
| 24 | GET    | `/api/v1/library/{resource_id}`                    | Library     | Get single resource details              |
| 25 | GET    | `/api/v1/activities`                               | Activities  | List activities (search, filter)         |
| 26 | GET    | `/api/v1/activities/{activity_id}`                 | Activities  | Get single activity details              |
| 27 | POST   | `/api/v1/activity-logs`                            | Activities  | Log activity start/completion            |
| 28 | GET    | `/api/v1/activity-logs`                            | Activities  | List activity log history                |
| 29 | GET    | `/api/v1/notifications`                            | Notifications | List user notifications                |
| 30 | PUT    | `/api/v1/notifications/{notification_id}/read`     | Notifications | Mark notification as read             |
| 31 | GET    | `/api/v1/profile`                                  | Profile     | Get user profile                         |
| 32 | PUT    | `/api/v1/profile`                                  | Profile     | Update user profile                      |

**Total: 32 endpoints (excluding authentication)**

---

## Seed Data Requirements

The following seed data must be pre-populated in the database before the APIs can function correctly:

1. **Daily Suggestions** — At least 7 rotating suggestions with activity names and illustration URLs.
2. **Library Resources** — At least 48 pre-defined resources across all categories (emotions, routines, social, communication) and age groups.
3. **Activities** — At least 35 pre-defined activities with images, descriptions, age ranges, stages, and durations.

Create a seed script (`seed.py` or Alembic seed) that populates these tables.

---

## Development Guidelines

1. **Project Structure** — Follow a modular FastAPI structure:
   ```
   app/
   ├── main.py
   ├── config.py
   ├── dependencies.py
   ├── database.py            # SQLAlchemy engine + session for SQLite
   ├── models/
   ├── schemas/
   ├── routers/
   │   ├── dashboard.py
   │   ├── scripts.py
   │   ├── progress.py
   │   ├── reports.py
   │   ├── library.py
   │   ├── activities.py
   │   ├── notifications.py
   │   └── profile.py
   ├── services/
   ├── crud/
   ├── utils/
   └── seed.py               # Database seed script
   ```

   **SQLite Database Setup (database.py):**
   ```python
   from sqlalchemy import create_engine
   from sqlalchemy.orm import sessionmaker, DeclarativeBase

   DATABASE_URL = "sqlite:///./scriptpal.db"

   engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
   SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

   class Base(DeclarativeBase):
       pass
   ```

   > **Important:** The `check_same_thread=False` argument is required for SQLite when used with FastAPI's threaded request handling.

2. **Dependency Injection** — Use FastAPI's `Depends()` to inject the database session and extract `user_id` from the JWT token (reuse existing auth middleware).

3. **Error Handling** — Use a global exception handler that catches `HTTPException` and custom app exceptions, returning the standard error envelope format.

4. **Pagination** — All list endpoints MUST support pagination with `page` and `page_size` query parameters. Use a reusable pagination utility.

5. **Validation** — Use Pydantic v2 models for all request/response schemas. Include field-level validation, enum constraints, and length limits.

6. **Filtering & Sorting** — List endpoints that support filtering should accept query parameters and build SQLAlchemy filters dynamically.

7. **Timezone Handling** — All timestamps must be stored and returned in UTC. The frontend handles timezone conversion.

8. **API Testing** — All endpoints must be tested via Swagger UI at `/docs`. Additionally, export a **Postman collection** containing all 32 endpoints with sample requests and responses.

9. **SQLite Considerations**
   - Store the `.db` file at the project root (e.g., `scriptpal.db`) and add it to `.gitignore`.
   - Use synchronous SQLAlchemy sessions (SQLite has limited async support; use `aiosqlite` only if async is strictly needed).
   - For UUID columns, define them as `String(36)` in SQLAlchemy models and generate UUIDs in Python: `import uuid; id = str(uuid.uuid4())`.
   - For ENUM-like columns, use `String` in SQLAlchemy and validate values in Pydantic schemas using `Literal` or `Enum` types.
   - Avoid concurrent write-heavy operations — SQLite uses file-level locking. For this app's scale (single-user/therapist), this is not a concern.

9. **Logging** — Use Python's `logging` module. Log all requests, errors, and database queries (in debug mode).

10. **Environment Configuration** — Use `.env` for configuration (database URL, JWT secret, email SMTP settings, etc.). Use `pydantic-settings` for config management.

    ```
    # .env example
    DATABASE_URL=sqlite:///./scriptpal.db
    JWT_SECRET=your-secret-key
    JWT_ALGORITHM=HS256
    ```

---

## Acceptance Criteria

- [ ] All 32 endpoints are implemented and functional
- [ ] Swagger docs at `/docs` show all endpoints with correct schemas
- [ ] Postman collection exported with all endpoints and sample data
- [ ] Database initialized with SQLAlchemy models (tables auto-created on startup or via migration)
- [ ] `scriptpal.db` file generated and seed data populated
- [ ] Seed data script created and tested
- [ ] All list endpoints support pagination
- [ ] All filter parameters work correctly
- [ ] Error responses follow the standard envelope format
- [ ] Input validation rejects invalid data with clear error messages
- [ ] API responses match the schemas defined in this document
- [ ] SQLite database file is excluded from version control (`.gitignore`)
- [ ] Auth middleware correctly extracts `user_id` and scopes data per user
- [ ] Report PDF generation works (at minimum a stub endpoint returning a sample PDF)
- [ ] Email sharing integration (at minimum a stub that logs the email payload)
