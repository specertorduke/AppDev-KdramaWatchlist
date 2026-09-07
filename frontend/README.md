# SarangTV Web Frontend

Modern React + Vite web dashboard for tracking K-Dramas, logging episode progress, discovering trending titles, and managing watchlists.

---

## 🛠️ Tech Stack

* **Framework**: [React 19](https://react.dev/)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Routing**: [React Router v7](https://reactrouter.com/)
* **HTTP Client**: [Axios](https://axios-http.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Linter**: [Oxlint](https://oxc.rs/)

---

## 📁 Directory Structure

```
src/
├── assets/          # Static media and logos
├── components/      # UI components & page layouts (Dashboard, Discover, Tracker, Profile)
├── context/         # AuthContext & global state providers
├── data/            # Mock & reference fallback datasets
├── services/        # Axios client instance (api.js) and Auth API wrappers (authService.js)
├── App.css          # Design system, themes, and component styles
├── App.jsx          # Route definitions & AuthPage form logic
├── index.css        # Global CSS resets
└── main.jsx         # Application entry point
```

---

## ⚙️ Environment Configuration

Copy the example environment file to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api/v1` | URL of the Laravel backend API |

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview the production build**:
   ```bash
   npm run preview
   ```

---

## 🔒 Authentication & Routes

* `/` — **Landing Page**: Public welcome and feature overview.
* `/login` — **Log In**: Authenticate using backend Sanctum tokens.
* `/signup` — **Sign Up**: Register a new account with backend validation.
* `/dashboard` — **Dashboard** *(Protected)*: Watch status overview, current show progress, quick actions.
* `/discover` — **Discover** *(Protected)*: Browse dramas and filter by genre.
* `/tracker` — **My Tracker** *(Protected)*: Track watched episodes, ratings, and watch status.
* `/profile` — **Profile** *(Protected)*: View user stats and sign out.
