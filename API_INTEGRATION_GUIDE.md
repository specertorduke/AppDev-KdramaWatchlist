# K-Drama Watchlist API Handover & Integration Plan

Comprehensive API documentation, endpoint reference, schema contracts, and UI integration guide for the frontend application.

---

## 1. Global Configuration & Auth Flow

### 1.1 Base URL & Environment Configuration
All application API routes are versioned under the `/api/v1` prefix.

| Environment | Base URL |
| :--- | :--- |
| **Local Development** | `http://localhost:8000/api/v1` (or `http://127.0.0.1:8000/api/v1`) |
| **Staging / Production** | `https://your-domain.com/api/v1` |

### 1.2 Mandatory Request Headers
Every request from the frontend HTTP client (Axios, Fetch, or TanStack Query) must include:

```http
Accept: application/json
Content-Type: application/json
```

For protected routes (`auth:sanctum`), attach the user's bearer token:

```http
Authorization: Bearer <plain_text_token>
```

> [!IMPORTANT]
> The `Accept: application/json` header is critical. It forces Laravel exception handlers to return standard JSON error objects instead of redirecting or returning HTML.

### 1.3 Authentication & Token Lifecycle
1. **Token Storage**: After successful registration (`POST /auth/register`) or login (`POST /auth/login`), store the returned `token` in a secure browser storage mechanism (e.g., `localStorage`, `sessionStorage`, or an in-memory auth state accompanied by secure HTTP cookies).
2. **Global Request Interceptor**: Configure an Axios / fetch interceptor that dynamically injects the token into outgoing request headers.
3. **Handling `401 Unauthorized`**:
   - Register a global response interceptor for HTTP `401`.
   - When a `401` occurs:
     1. Clear the stored authentication token and user profile state.
     2. Redirect the user to the `/login` route with a return URL query parameter (e.g., `/login?redirect=/tracker`).
     3. Display a toast notification: *"Your session has expired. Please log in again."*

---

## 2. Complete API Endpoint Reference

| Group | Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register` | Public | Register new user account & get token |
| **Auth** | `POST` | `/auth/login` | Public | Authenticate user & get token |
| **Auth** | `GET` | `/auth/me` | Yes (`Bearer`) | Get currently authenticated user data |
| **Auth** | `POST` | `/auth/logout` | Yes (`Bearer`) | Invalidate current session token |
| **Auth** | `POST` | `/auth/logout-all` | Yes (`Bearer`) | Invalidate all active tokens across devices |
| **Auth** | `POST` | `/auth/forgot-password` | Public | Send password reset link email |
| **Auth** | `POST` | `/auth/reset-password` | Public | Reset password using email token |
| **Auth / User** | `PATCH` | `/auth/password` | Yes (`Bearer`) | Change password (also available at `PUT/PATCH /user/password`) |
| **User / Profile** | `GET` | `/user/profile` | Yes (`Bearer`) | Fetch user data with aggregated tracker stats |
| **User / Profile** | `GET` | `/user/stats` | Yes (`Bearer`) | Alias for user profile stats |
| **User / Profile** | `DELETE`| `/user` | Yes (`Bearer`) | Permanently delete user account and associated trackers |
| **Home / Dashboard** | `GET` | `/home` | Yes (`Bearer`) | Aggregated dashboard: greeting, stats, continue watching, recommendations |
| **Discover** | `GET` | `/discover` | Yes (`Bearer`) | Browse top K-dramas with genre filtering and search fallback |
| **Discover** | `GET` | `/discover/genres` | Yes (`Bearer`) | List all available TMDB TV genre categories |
| **Discover** | `GET` | `/discover/search` | Yes (`Bearer`) | Search K-dramas by title, actor/actress, or keyword |
| **Discover** | `GET` | `/discover/{tmdb_id}` | Yes (`Bearer`) | Full drama details with Season 1 episodes, trailer & credits |
| **Tracker** | `GET` | `/tracker` | Yes (`Bearer`) | List tracked dramas with status/favorite filter and status counts |
| **Tracker** | `POST` | `/tracker` | Yes (`Bearer`) | Add a drama to the user's watchlist/tracker |
| **Tracker** | `GET` | `/tracker/{tmdb_id}` | Yes (`Bearer`) | Get detailed tracker progress and metadata for a drama |
| **Tracker** | `PATCH` | `/tracker/{tmdb_id}` | Yes (`Bearer`) | Update episode progress, status, rating, notes, or favorite flag |
| **Tracker** | `POST` | `/tracker/{tmdb_id}/increment` | Yes (`Bearer`) | Increment current episode by +1 with auto-completion |
| **Tracker** | `DELETE`| `/tracker/{tmdb_id}` | Yes (`Bearer`) | Remove drama from tracker |

---

## 3. Per-Endpoint Specifications

### 3.1 Authentication & Profile Endpoints

---

#### 1. Register User
- **Route:** `POST /api/v1/auth/register`
- **Auth:** Public (Rate limit: 10 req/min)
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "password_confirmation": "Password123!",
    "device_name": "Web Browser" // optional
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatar_url": null,
      "email_verified_at": null,
      "created_at": "2026-08-26T12:00:00.000000Z",
      "updated_at": "2026-08-26T12:00:00.000000Z"
    },
    "token": "1|abc1234567890abcdef..."
  }
  ```
- **Errors:**
  - `422 Unprocessable Content`: Validation failure (e.g., email already exists, password confirmation mismatch).

---

#### 2. User Login
- **Route:** `POST /api/v1/auth/login`
- **Auth:** Public (Rate limit: 6 req/min)
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!",
    "device_name": "Web Browser" // optional
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatar_url": null,
      "email_verified_at": null,
      "created_at": "2026-08-26T12:00:00.000000Z",
      "updated_at": "2026-08-26T12:00:00.000000Z"
    },
    "token": "2|xyz9876543210zyxwvu..."
  }
  ```
- **Errors:**
  - `422 Unprocessable Content`: Invalid credentials (`The provided credentials do not match our records.`).

---

#### 3. Current User (`/me`)
- **Route:** `GET /api/v1/auth/me`
- **Auth:** `Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar_url": null,
    "email_verified_at": null,
    "created_at": "2026-08-26T12:00:00.000000Z",
    "updated_at": "2026-08-26T12:00:00.000000Z"
  }
  ```

---

#### 4. Logout / Logout All
- **Route:** `POST /api/v1/auth/logout` | `POST /api/v1/auth/logout-all`
- **Auth:** `Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

#### 5. User Profile & Aggregated Stats
- **Route:** `GET /api/v1/user/profile` (or `GET /api/v1/user/stats`)
- **Auth:** `Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatar_url": null,
      "email_verified_at": null,
      "created_at": "2026-08-26T12:00:00.000000Z",
      "updated_at": "2026-08-26T12:00:00.000000Z"
    },
    "stats": {
      "total_dramas": 14,
      "episodes_watched": 168,
      "hours_watched": 168.0,
      "average_rating": 8.5,
      "status_breakdown": {
        "watching": 3,
        "completed": 8,
        "plan_to_watch": 2,
        "on_hold": 1,
        "dropped": 0
      }
    }
  }
  ```

---

#### 6. Update Password
- **Route:** `PATCH /api/v1/auth/password` (or `PUT/PATCH /api/v1/user/password`)
- **Auth:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "current_password": "OldPassword123!",
    "password": "NewSecurePassword456!",
    "password_confirmation": "NewSecurePassword456!"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Password updated successfully."
  }
  ```
- **Errors:**
  - `422 Unprocessable Content`: `current_password` does not match, or validation rules fail.

---

#### 7. Delete User Account
- **Route:** `DELETE /api/v1/user`
- **Auth:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "current_password": "Password123!"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Account deleted successfully."
  }
  ```
- **Behavior:** Cascades and deletes all user trackers and revokes all active tokens.

---

### 3.2 Home / Dashboard Endpoint

#### Get Aggregated Dashboard
- **Route:** `GET /api/v1/home`
- **Auth:** `Bearer <token>`
- **Description:** Single query endpoint returning greeting data, summary stats, the user's most recently active currently watching drama, and top recommended dramas.
- **Success Response (`200 OK`):**
  ```json
  {
    "data": {
      "greeting": {
        "user_name": "Jane Doe"
      },
      "stats": {
        "listed": 12,
        "watching": 2,
        "completed": 7,
        "hours_watched": 84.0
      },
      "currently_watching": {
        "id": 5,
        "tmdb_id": 94997,
        "title": "Crash Landing on You",
        "poster_url": "https://image.tmdb.org/t/p/original/b51XoE0j8r0Lz7a3G.jpg",
        "current_episode": 9,
        "next_episode": 10,
        "total_episodes": 16,
        "episode_runtime": 70,
        "progress_percentage": 56,
        "status": "watching"
      },
      "recommended": [
        {
          "tmdb_id": 110316,
          "title": "Vincenzo",
          "poster_url": "https://image.tmdb.org/t/p/original/vWlywimVzLgL4W921.jpg",
          "rating": 8.7,
          "genres": ["Drama", "Comedy", "Crime"],
          "total_episodes": 20
        }
      ]
    }
  }
  ```
- **Note:** If the user has no drama with status `watching`, `currently_watching` is `null`.

---

### 3.3 Discover Endpoints

#### 1. Browse / Discover K-Dramas
- **Route:** `GET /api/v1/discover`
- **Auth:** `Bearer <token>`
- **Query Parameters:**
  - `page` *(optional, integer, min: 1, max: 500, default: 1)*
  - `genre_id` *(optional, integer, e.g. 18, 35, 10759)*
  - `search` / `query` *(optional, string, max: 255 — if passed, automatically routes to search logic)*
- **Success Response (`200 OK`):**
  ```json
  {
    "data": [
      {
        "tmdb_id": 94997,
        "title": "Crash Landing on You",
        "poster_url": "https://image.tmdb.org/t/p/w500/b51XoE0j8r0Lz7a3G.jpg",
        "release_year": 2019,
        "rating": 8.8,
        "rank": 1,
        "genres": ["Drama", "Comedy"],
        "total_episodes": 16,
        "watch_status": "watching" // null if not tracked, or "watching" | "completed" | "plan_to_watch" | "on_hold" | "dropped"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 42,
      "has_more": true
    }
  }
  ```

---

#### 2. Get Genres List
- **Route:** `GET /api/v1/discover/genres`
- **Auth:** `Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "data": [
      { "id": 18, "name": "Drama" },
      { "id": 35, "name": "Comedy" },
      { "id": 10759, "name": "Action & Adventure" },
      { "id": 9648, "name": "Mystery" },
      { "id": 10765, "name": "Sci-Fi & Fantasy" }
    ]
  }
  ```

---

#### 3. Search K-Dramas
- **Route:** `GET /api/v1/discover/search`
- **Auth:** `Bearer <token>`
- **Query Parameters:**
  - `query` or `search` *(required, string, min: 1, max: 255)*
  - `page` *(optional, integer, min: 1, max: 500, default: 1)*
- **Features:** Searches titles, actor/actress filmographies, and theme keywords; Korean productions are ranked first.
- **Success Response (`200 OK`):**
  ```json
  {
    "data": [
      {
        "tmdb_id": 110316,
        "title": "Vincenzo",
        "poster_url": "https://image.tmdb.org/t/p/w500/vWlywimVzLgL4W921.jpg",
        "release_year": 2021,
        "rating": 8.7,
        "rank": 1,
        "genres": ["Drama", "Comedy", "Crime"],
        "total_episodes": 20,
        "watch_status": null
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 3,
      "has_more": true
    }
  }
  ```

---

#### 4. Get Drama Detail
- **Route:** `GET /api/v1/discover/{tmdb_id}`
- **Auth:** `Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "data": {
      "tmdb_id": 94997,
      "title": "Crash Landing on You",
      "original_title": "사랑의 불시착",
      "release_year": 2019,
      "genres": ["Drama", "Comedy"],
      "rating": 8.8,
      "vote_count": 520,
      "poster_url": "https://image.tmdb.org/t/p/original/b51XoE0j8r0Lz7a3G.jpg",
      "backdrop_url": "https://image.tmdb.org/t/p/original/qZ2gA7qY4jPjO9v1kL9g.jpg",
      "overview": "A paragliding mishap drops a South Korean heiress in North Korea...",
      "status": "Ended",
      "number_of_seasons": 1,
      "number_of_episodes": 16,
      "seasons": [
        {
          "id": 133281,
          "name": "Season 1",
          "season_number": 1,
          "episode_count": 16,
          "poster_url": "https://image.tmdb.org/t/p/original/...",
          "air_date": "2019-12-14"
        }
      ],
      "episodes": [
        {
          "id": 2004245,
          "episode_number": 1,
          "name": "Episode 1",
          "overview": "While testing her new paragliding apparel...",
          "runtime": 70,
          "still_url": "https://image.tmdb.org/t/p/original/ep1_still.jpg",
          "air_date": "2019-12-14",
          "rating": 8.4
        }
      ],
      "trailer": {
        "key": "eXMjTXL2Vks",
        "site": "YouTube",
        "url": "https://www.youtube.com/watch?v=eXMjTXL2Vks"
      },
      "watch_status": "watching"
    }
  }
  ```
- **Errors:**
  - `404 Not Found`: Resource not found on TMDB.

---

### 3.4 Tracker Endpoints

---

#### 1. List Tracked Dramas
- **Route:** `GET /api/v1/tracker`
- **Auth:** `Bearer <token>`
- **Query Parameters:**
  - `status` *(optional, string, `all` \| `watching` \| `completed` \| `plan_to_watch` \| `on_hold` \| `dropped`, default: `all`)*
  - `favorite` *(optional, boolean, `true` \| `false` \| `1` \| `0`)*
  - `page` *(optional, integer, min: 1, default: 1)*
  - `per_page` *(optional, integer, min: 1, max: 100, default: 20)*
- **Success Response (`200 OK`):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "tmdb_id": 94997,
        "status": "watching",
        "current_episode": 9,
        "total_episodes": 16,
        "progress_percentage": 56,
        "rating": 9,
        "review_notes": "One of the best romantic dramas!",
        "rewatch_count": 0,
        "is_favorite": true,
        "created_at": "2026-08-26T12:00:00.000000Z",
        "updated_at": "2026-08-26T14:30:00.000000Z",
        "drama": {
          "tmdb_id": 94997,
          "title": "Crash Landing on You",
          "poster_url": "https://image.tmdb.org/t/p/w500/b51XoE0j8r0Lz7a3G.jpg",
          "release_year": 2019,
          "rating": 8.8,
          "rank": null,
          "genres": ["Drama", "Comedy"],
          "total_episodes": 16,
          "watch_status": "watching"
        }
      }
    ],
    "meta": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 20,
      "total": 1,
      "counts": {
        "all": 6,
        "favorites": 3,
        "watching": 2,
        "completed": 3,
        "plan_to_watch": 1,
        "on_hold": 0,
        "dropped": 0
      }
    }
  }
  ```

---

#### 2. Get Single Tracker Item
- **Route:** `GET /api/v1/tracker/{tmdb_id}`
- **Auth:** `Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "data": {
      "id": 1,
      "tmdb_id": 94997,
      "status": "watching",
      "current_episode": 9,
      "total_episodes": 16,
      "progress_percentage": 56,
      "rating": 9,
      "review_notes": "Great pacing and soundtrack.",
      "rewatch_count": 0,
      "is_favorite": true,
      "created_at": "2026-08-26T12:00:00.000000Z",
      "updated_at": "2026-08-26T14:30:00.000000Z",
      "drama": {
        "tmdb_id": 94997,
        "title": "Crash Landing on You",
        "original_title": "사랑의 불시착",
        "release_year": 2019,
        "genres": ["Drama", "Comedy"],
        "rating": 8.8,
        "vote_count": 520,
        "poster_url": "https://image.tmdb.org/t/p/original/b51XoE0j8r0Lz7a3G.jpg",
        "backdrop_url": "https://image.tmdb.org/t/p/original/qZ2gA7qY4jPjO9v1kL9g.jpg",
        "overview": "A paragliding mishap drops a South Korean heiress in North Korea...",
        "status": "Ended",
        "number_of_seasons": 1,
        "number_of_episodes": 16,
        "seasons": [...],
        "episodes": [...],
        "trailer": { ... },
        "watch_status": "watching"
      }
    }
  }
  ```
- **Errors:**
  - `404 Not Found`: `{"message": "Drama is not in your tracker."}`

---

#### 3. Add Drama to Tracker
- **Route:** `POST /api/v1/tracker`
- **Auth:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "tmdb_id": 94997,
    "status": "watching", // optional, defaults to 'plan_to_watch'
    "current_episode": 1, // optional, defaults to 0
    "total_episodes": 16, // optional, auto-fetched from TMDB if omitted
    "rating": 9, // optional, integer 1-10
    "review_notes": "Starting this tonight!", // optional, string max 5000
    "rewatch_count": 0, // optional, integer
    "is_favorite": false // optional, boolean
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "message": "Drama added to tracker successfully.",
    "data": {
      "id": 1,
      "tmdb_id": 94997,
      "status": "watching",
      "current_episode": 1,
      "total_episodes": 16,
      "progress_percentage": 6,
      "rating": 9,
      "review_notes": "Starting this tonight!",
      "rewatch_count": 0,
      "is_favorite": false,
      "created_at": "2026-08-26T12:00:00.000000Z",
      "updated_at": "2026-08-26T12:00:00.000000Z",
      "drama": { ... }
    }
  }
  ```
- **Errors:**
  - `422 Unprocessable Content`:
    - `{"errors": {"tmdb_id": ["You are already tracking this drama."]}}`
    - `{"errors": {"current_episode": ["The current episode cannot exceed the total episodes."]}}`

---

#### 4. Update / Jump Progress
- **Route:** `PATCH /api/v1/tracker/{tmdb_id}`
- **Auth:** `Bearer <token>`
- **Request Body (All fields optional):**
  ```json
  {
    "status": "watching", // "watching" | "completed" | "plan_to_watch" | "on_hold" | "dropped"
    "current_episode": 16,
    "total_episodes": 16,
    "rating": 10,
    "review_notes": "Masterpiece!",
    "rewatch_count": 1,
    "is_favorite": true
  }
  ```
- **Automatic State Transitions (if `status` omitted in payload):**
  - If `current_episode >= total_episodes` $\rightarrow$ automatically sets status to `completed`.
  - If status was `completed` and `current_episode` is reduced below `total_episodes` $\rightarrow$ transitions to `watching` (or `plan_to_watch` if `current_episode === 0`).
  - If status was `plan_to_watch` and `current_episode > 0` $\rightarrow$ transitions to `watching`.
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Tracker updated successfully.",
    "data": {
      "id": 1,
      "tmdb_id": 94997,
      "status": "completed",
      "current_episode": 16,
      "total_episodes": 16,
      "progress_percentage": 100,
      "rating": 10,
      "review_notes": "Masterpiece!",
      "rewatch_count": 1,
      "is_favorite": true,
      "created_at": "2026-08-26T12:00:00.000000Z",
      "updated_at": "2026-08-26T15:00:00.000000Z",
      "drama": { ... }
    }
  }
  ```

---

#### 5. Quick Increment Episode (+1)
- **Route:** `POST /api/v1/tracker/{tmdb_id}/increment`
- **Auth:** `Bearer <token>`
- **Request Body:** None (empty)
- **Description:** Adds `+1` to `current_episode`. Automatically marks status as `completed` when reaching `total_episodes`.
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Episode incremented successfully.",
    "data": {
      "id": 1,
      "tmdb_id": 94997,
      "status": "watching",
      "current_episode": 10,
      "total_episodes": 16,
      "progress_percentage": 63,
      "rating": 9,
      "review_notes": "...",
      "rewatch_count": 0,
      "is_favorite": true,
      "created_at": "2026-08-26T12:00:00.000000Z",
      "updated_at": "2026-08-26T15:10:00.000000Z",
      "drama": { ... }
    }
  }
  ```
- **Errors:**
  - `404 Not Found`: Drama not in tracker.
  - `422 Unprocessable Content`: Current episode is already at total episodes (`Current episode is already at the maximum total episodes.`).

---

#### 6. Remove Drama from Tracker
- **Route:** `DELETE /api/v1/tracker/{tmdb_id}`
- **Auth:** `Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Drama removed from tracker successfully."
  }
  ```
- **Errors:**
  - `404 Not Found`: Drama not in tracker.

---

## 4. Frontend Integration & Data Dictionaries

### 4.1 Status Enum & UI Mapping

```typescript
export type WatchStatus = 
  | 'watching'
  | 'completed'
  | 'plan_to_watch'
  | 'on_hold'
  | 'dropped';

export const WATCH_STATUS_CONFIG: Record<WatchStatus, { label: string; badgeColor: string }> = {
  watching: { label: 'Watching', badgeColor: '#3B82F6' },
  completed: { label: 'Completed', badgeColor: '#10B981' },
  plan_to_watch: { label: 'Plan to Watch', badgeColor: '#8B5CF6' },
  on_hold: { label: 'On Hold', badgeColor: '#F59E0B' },
  dropped: { label: 'Dropped', badgeColor: '#EF4444' }
};
```

### 4.2 Episode Checkbox & Progress Bar Mechanics

In drama details (`/discover/:id`) and tracking modals:
1. **Determining Watched State**:
   ```typescript
   const isEpisodeWatched = (episodeNumber: number, trackerCurrentEpisode: number): boolean => {
     return episodeNumber <= trackerCurrentEpisode;
   };
   ```
2. **Clicking an Episode Item / Checkbox**:
   - When a user clicks episode `K`:
     - If episode `K` is not watched: Send `PATCH /tracker/{tmdb_id}` with `{ current_episode: K }`.
     - If user clicks episode `K` and it is currently the highest watched episode (`tracker.current_episode === K`): Send `PATCH /tracker/{tmdb_id}` with `{ current_episode: K - 1 }` to uncheck it.
3. **Progress Percentage Calculation**:
   $$\text{Progress \%} = \min\left(100, \max\left(0, \operatorname{round}\left(\frac{\text{current\_episode}}{\text{total\_episodes}} \times 100\right)\right)\right)$$

### 4.3 UI Screen Bindings & Flow Guide

```
+-------------------------------------------------------------------------------+
|                             HOME DASHBOARD (/home)                            |
| +-------------------------+ +-----------------------------------------------+ |
| | Greeting: Jane Doe      | | Currently Watching Banner                     | |
| | Stats: 12 Listed        | | "Crash Landing on You" (Ep 9/16 - 56%)        | |
| | 2 Watching, 7 Done      | | [ +1 Quick Ep Button ] -> POST /increment     | |
| | 84.0 Hours Watched      | | [ View Detail ] -> /discover/94997            | |
| +-------------------------+ +-----------------------------------------------+ |
|                                                                               |
| Recommended Dramas Carousel/Grid (GET /discover page 1)                       |
+-------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
|                           TRACKER SCREEN (/tracker)                           |
|  [All (6)]  [Favorites (3)]  [Watching (2)]  [Completed (3)]  [Plan (1)] ...   |
|  (Pill badges mapped directly to meta.counts from GET /tracker)               |
|                                                                               |
|  Grid of Tracked Cards:                                                       |
|  - Poster, Title, Rating badge, Favorite heart toggle                         |
|  - Linear Progress Bar (56%)                                                  |
|  - Quick +1 Button (POST /tracker/{id}/increment)                             |
|  - Status Dropdown Selector (PATCH /tracker/{id})                             |
+-------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
|                       DRAMA DETAIL SCREEN (/discover/:id)                     |
|  - Backdrop Banner, Poster, Title, Genres, Release Year, TMDB Rating          |
|  - Watch Status Action Bar (Add to Watchlist / Status Dropdown / Favorite)    |
|  - Embedded YouTube Trailer Player                                            |
|  - Season 1 Episode List:                                                     |
|    [✓] Ep 1: Still thumbnail, runtime, title, overview                        |
|    [✓] Ep 2: Checked if ep.episode_number <= current_episode                  |
|    [ ] Ep 3: Click to jump/update progress                                    |
+-------------------------------------------------------------------------------+
```

---

## 5. TypeScript Interfaces for Frontend Models

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_dramas: number;
  episodes_watched: number;
  hours_watched: number;
  average_rating: number | null;
  status_breakdown: {
    watching: number;
    completed: number;
    plan_to_watch: number;
    on_hold: number;
    dropped: number;
  };
}

export interface DramaCard {
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  rating: number;
  rank?: number | null;
  genres: string[];
  total_episodes: number | null;
  watch_status: WatchStatus | null;
}

export interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string | null;
  runtime: number | null;
  still_url: string | null;
  air_date: string | null;
  rating: number;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_url: string | null;
  air_date: string | null;
}

export interface DramaDetail {
  tmdb_id: number;
  title: string;
  original_title: string | null;
  release_year: number | null;
  genres: string[];
  rating: number;
  vote_count: number;
  poster_url: string | null;
  backdrop_url: string | null;
  overview: string | null;
  status: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  seasons: Season[];
  episodes: Episode[];
  trailer: {
    key: string;
    site: string;
    url: string;
  } | null;
  watch_status: WatchStatus | null;
}

export interface TrackerItem {
  id: number;
  tmdb_id: number;
  status: WatchStatus;
  current_episode: number;
  total_episodes: number | null;
  progress_percentage: number;
  rating: number | null;
  review_notes: string | null;
  rewatch_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  drama: DramaCard | DramaDetail | null;
}

export interface TrackerMetaCounts {
  all: number;
  favorites: number;
  watching: number;
  completed: number;
  plan_to_watch: number;
  on_hold: number;
  dropped: number;
}
```
