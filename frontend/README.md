# Enterprise Asset Management Frontend

React admin workspace for the Enterprise Asset Management MVP, built with Vite and Tailwind CSS.

## Local Setup

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The default frontend URL is `http://localhost:5173`.

## Environment

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

## Scripts

- `npm run dev`: start the Vite development server.
- `npm run build`: create a production build.
- `npm run lint`: run ESLint.
- `npm run preview`: preview the production build.

## Styling

The project uses Tailwind CSS 4 through the official `@tailwindcss/vite` plugin.
Shared theme colors are declared in `src/index.css` with the `eam-*` namespace.

## Week 1 Scope

- Admin routing and protected route skeleton.
- Login connected to `POST /api/auth/login`.
- Current-user bootstrap through `GET /api/auth/me`.
- Shared admin layout, sidebar and top bar.
- Reusable table, form field, modal and status badge components.
- Admin route shells with demo data for week 2 API integration.
