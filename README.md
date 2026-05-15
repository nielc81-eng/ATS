# UILANG

Frontend UI for an ATS-style app (AI Resume Screening) built with React + Vite + Tailwind CSS.

## Requirements
- Node.js (recommended: latest LTS)
- npm (comes with Node.js)

## Setup
```bash
npm install
```

## Run (development)
```bash
npm run dev
```
Vite will print the local dev URL (typically `http://localhost:5173`).

## Build / Preview
```bash
npm run build
npm run preview
```

## App Notes
- Routing is handled by `react-router-dom`.
- Auth is a lightweight demo session stored in `localStorage` (see `src/context/AuthContext.jsx`).
- Main routes live in `src/App.jsx` with four protected role experiences aligned to Processes 1.0–1.4:
  - `Candidate`
  - `Recruiter` (displayed in UI as `Talent Acquisition`)
  - `DeploymentManager`
  - `Administrator`
- Protected role route families:
  - `/candidate/*`
  - `/recruiter/*` (Talent Acquisition display label)
  - `/deployment-manager/*`
  - `/admin/*`
- Login policy includes failed-attempt tracking and temporary lockout (`MAX_LOGIN_ATTEMPTS=5`, `LOCK_DURATION_MINUTES=15`) in local storage.

## Project Structure (high level)
- `src/components` - shared UI components + layout
- `src/pages` - page-level screens
- `src/routes` - route guards (public/protected)
- `src/context` - app context providers (auth)
- `src/lib` - small helpers/utilities

## Docs
- ERD (conceptual): `docs/erd.md`
