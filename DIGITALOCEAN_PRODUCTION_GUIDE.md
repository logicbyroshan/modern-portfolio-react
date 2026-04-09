# DigitalOcean Production Guide

This guide is for your current setup:

- Frontend on `www.roshandmaor.me`
- Django admin and API on `admin.roshandmaor.me`

If frontend works but admin does not, most issues are from host, CSRF, proxy headers, or missing static collect.

## 1. Backend .env (required)

Use one value per key (no duplicates). In this project, env loading uses `setdefault`, so the first value wins.

```env
# Django core
DJANGO_SECRET_KEY=replace-with-a-very-long-random-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=www.roshandmaor.me,admin.roshandmaor.me,www.roshandamor.me,admin.roshandamor.me

# Optional: keep empty unless you also send X-API-Key from clients
PORTFOLIO_API_KEY=
TINYMCE_API_KEY=no-api-key

# Domains
PUBLIC_SITE_DOMAIN=www.roshandmaor.me
ADMIN_SITE_DOMAIN=admin.roshandmaor.me

# PostgreSQL
DB_ENGINE=django.db.backends.postgresql
DB_NAME=portfolio_db
DB_USER=portfolio_user
DB_PASSWORD=replace-with-strong-db-password
DB_HOST=127.0.0.1
DB_PORT=5432

# DB reliability/perf
DB_CONN_MAX_AGE=60
DB_CONN_HEALTH_CHECKS=True
DB_CONNECT_TIMEOUT=10
DB_STATEMENT_TIMEOUT_MS=15000
DB_OPTIONS=
DISALLOW_SQLITE_IN_PRODUCTION=True

# CORS / CSRF
CORS_ALLOWED_ORIGINS=https://www.roshandmaor.me,https://admin.roshandmaor.me,https://www.roshandamor.me,https://admin.roshandamor.me
CORS_ALLOW_CREDENTIALS=False
CORS_ALLOWED_METHODS=GET,POST,OPTIONS
CSRF_TRUSTED_ORIGINS=https://www.roshandmaor.me,https://admin.roshandmaor.me,https://www.roshandamor.me,https://admin.roshandamor.me

# Security / proxy
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SESSION_COOKIE_SAMESITE=Lax
CSRF_COOKIE_SAMESITE=Lax
USE_X_FORWARDED_HOST=True
TRUST_X_FORWARDED_PROTO=True
TRUST_X_FORWARDED_FOR=True

# Browser/security headers
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_REFERRER_POLICY=strict-origin-when-cross-origin
SECURE_CROSS_ORIGIN_OPENER_POLICY=same-origin
SECURE_CROSS_ORIGIN_RESOURCE_POLICY=same-origin
X_FRAME_OPTIONS=DENY
```

## 2. Frontend .env (production)

```env
VITE_API_BASE_URL=https://admin.roshandmaor.me/api
VITE_API_TIMEOUT_MS=7000
VITE_API_RETRY_ATTEMPTS=1
VITE_PORTFOLIO_CACHE_TTL_MS=300000
```

## 3. DigitalOcean deployment steps

1. DNS:
   - `www.roshandmaor.me` -> frontend
   - `admin.roshandmaor.me` -> backend
2. Set backend env variables from Section 1.
3. Set frontend env variables from Section 2, then rebuild frontend.
4. Run backend release commands:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check --deploy
```

5. Ensure at least one staff user exists:

```bash
python manage.py createsuperuser
```

6. If using Nginx/Caddy in front of Django, pass proxy headers:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## 4. Why admin fails while frontend works

Check these in order:

1. Admin host missing from `DJANGO_ALLOWED_HOSTS`.
2. `CSRF_TRUSTED_ORIGINS` missing `https://admin.roshandmaor.me`.
3. Reverse proxy not sending `X-Forwarded-Proto`.
4. `collectstatic` not run after deployment.
5. No staff/superuser account.
6. Duplicate keys in `.env` causing unexpected values.

## 5. Fast verification after deploy

1. Open `https://admin.roshandmaor.me/admin/login/`.
2. Log in with superuser.
3. Open `https://admin.roshandmaor.me/` and confirm dashboard loads.
4. Open `https://admin.roshandmaor.me/api/health/` and confirm API response.
5. Open frontend and verify it still loads API data.