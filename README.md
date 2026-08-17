# SarangTV: K-Drama Watchlist and Tracking System   

A modern, full-stack Kdrama Watchlist application built with a **Modular Monolith** architecture.

# Group Members
- Zander Duhaylungsod
- Hazeljoy Hingpit
- Nazlah Nanding
- Ervie Nazareno 

# Course: CCE 106L – Applications Development and Emerging Technologies


## 🏗 Repository Structure

```
.
├── backend/          # Laravel 11 API (Modular Monolith: Auth, Drama, Watchlist)
├── frontend/         # React + Vite Web Dashboard (Stats, Watchlist, Profile, Search)
└── mobile/           # React Native + Expo Mobile App (Quick Add, Progress Tracking)
```

---

## ⚡ Architectural Principles & Constraints

1. **Backend-Only Validation**:
   - Zero validation in JavaScript on the frontend (`frontend/` & `mobile/`).
   - Validation is handled exclusively on the backend (`backend/` Laravel Form Requests / Services).
   - Frontend directly submits form data to REST endpoints and handles backend HTTP `422 Unprocessable Content` responses.

2. **Resource-Oriented RESTful URIs**:
   - `POST /api/v1/users` (Signup)
   - `POST /api/v1/auth/tokens` (Login)
   - `DELETE /api/v1/auth/tokens` (Logout)
   - `GET /api/v1/dramas` (Search / discover dramas)
   - `GET /api/v1/dramas/{id}` (Drama metadata)
   - `GET /api/v1/watchlists` (User's watchlist filterable by status/genre)
   - `POST /api/v1/watchlists` (Add drama to watchlist)
   - `PATCH /api/v1/watchlists/{id}` (Update status, current_episode, rating, review, favorite)
   - `DELETE /api/v1/watchlists/{id}` (Remove from watchlist)

3. **Customized Laravel Modular Monolith**:
   - Isolated domain modules inside `backend/app/Modules/`:
     - **Auth**: User authentication & token management (Sanctum)
     - **Drama**: Drama catalogue management & TMDB metadata integration
     - **Watchlist**: Watchlist states (`plan_to_watch`, `watching`, `completed`, `dropped`), episode tracking, ratings (1–10), and reviews
   - Strict 4-Layer responsibility per module:
     - `Controller`: HTTP Request/Response parser
     - `Service`: Business logic & Backend validation
     - `Repository`: Database queries & Eloquent abstractions
     - `Model`: Schema definition & Eloquent relationships

---

## 🚀 Setup Instructions

### 1. Backend (`backend/`)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### 2. Web Frontend (`frontend/`)
```bash
cd frontend
npm install
npm run dev
```

### 3. Mobile Frontend (`mobile/`)
```bash
cd mobile
npm install
npx expo start
```
