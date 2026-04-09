# Server (Django Admin + API)

This folder hosts the Django backend that serves:
- Custom admin panel (template-based)
- Read-only/public API for client site

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
4. SSL certificate covers both subdomains.

The backend project root is this `server` folder.
