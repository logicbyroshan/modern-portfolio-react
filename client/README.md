# Client (React + Vite)

This package serves the public portfolio UI and hydrates section content from the Django API.

## Prerequisites

- Node.js 18+
- npm 9+
- Backend API running on `http://127.0.0.1:8000` (default local setup)

## Setup

```bash
cd client
npm install
copy .env.example .env
```

## Run

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

## Validation

```bash
npm run lint
npm run test
```

## Notes

- Default `VITE_API_BASE_URL=/api` is recommended for local dev and preview.
- Legacy section behavior is preserved by loading `portfolio-body.html` and static section scripts after hydration.
