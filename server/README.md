# Server (Django Admin + API)

This folder hosts the Django backend that serves:
- Custom admin panel (template-based)
- Read-only/public API for client site

## Local setup

```bash
cd server
python -m venv ../.venv
```

Windows PowerShell:

```bash
& ..\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source ../.venv/bin/activate
```

Install dependencies and bootstrap settings:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

## Validation commands

```bash
python manage.py check
python manage.py check --deploy
python manage.py test
```

## API key behavior

- Public read endpoints enforce `PORTFOLIO_API_KEY` when configured.
- Localhost requests (`localhost` / `127.0.0.1`) are allowed without API key to keep local dev, preview, and audit workflows smooth.

## Production notes
- Intended public website domain: `www.roshandmaor.me`
- Intended admin domain: `admin.roshandmaor.me`
- Legacy-compatible aliases are supported for `roshandamor.me` hostnames.
- Use PostgreSQL in production

## Admin subdomain checklist
1. DNS records exist for both `www.roshandmaor.me` and `admin.roshandmaor.me`.
2. Reverse proxy forwards host and proto headers:
	- `Host`
	- `X-Forwarded-Proto`
3. Django environment has production values for:
	- `DJANGO_ALLOWED_HOSTS`
	- `CSRF_TRUSTED_ORIGINS`
	- `CORS_ALLOWED_ORIGINS`
	- `CORS_ALLOW_CREDENTIALS=False`
	- `TRUST_X_FORWARDED_PROTO=True`
	- `TRUST_X_FORWARDED_FOR=True`
4. SSL certificate covers both subdomains.

## PostgreSQL performance and reliability knobs
Set these in production `.env`:

- `DB_CONN_MAX_AGE=60`
- `DB_CONN_HEALTH_CHECKS=True`
- `DB_CONNECT_TIMEOUT=10`
- `DB_STATEMENT_TIMEOUT_MS=15000`
- `DISALLOW_SQLITE_IN_PRODUCTION=True`

## Runtime hardening checks
Run before each release:

1. `python manage.py migrate`
2. `python manage.py check`
3. `python manage.py check --deploy`
4. `python manage.py test`

The backend project root is this `server` folder.
