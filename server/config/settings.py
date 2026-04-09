from pathlib import Path
import os
import sys
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


def load_env_file(path):
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file(BASE_DIR / ".env")

RUNNING_TESTS = "test" in sys.argv


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

def env_list(name, default=""):
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


def env_bool(name, default=False):
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def env_int(name, default=0):
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        return int(raw_value.strip())
    except (TypeError, ValueError):
        return default


def is_weak_secret_key(value):
    secret = (value or "").strip()
    if not secret:
        return True
    if len(secret) < 50:
        return True
    if len(set(secret)) < 5:
        return True
    if secret.startswith("django-insecure-"):
        return True
    return False


def normalize_host(value):
    host = (value or "").strip().lower()
    if not host:
        return ""

    if "://" in host:
        host = host.split("://", 1)[1]

    host = host.split("/", 1)[0]

    if ":" in host:
        host = host.split(":", 1)[0]

    return host.strip(".")


def host_aliases(host):
    aliases = []
    if "roshandamor.me" in host:
        aliases.append(host.replace("roshandamor.me", "roshandmaor.me"))
    if "roshandmaor.me" in host:
        aliases.append(host.replace("roshandmaor.me", "roshandamor.me"))
    return aliases


def unique_list(items):
    seen = set()
    unique_items = []

    for item in items:
        if not item:
            continue
        if item in seen:
            continue
        seen.add(item)
        unique_items.append(item)

    return unique_items


def domains_to_origins(domains):
    origins = []
    for domain in domains:
        host = normalize_host(domain)
        if not host:
            continue
        if host in {"localhost", "127.0.0.1"} or host.startswith("127."):
            origins.append(f"http://{host}")
        origins.append(f"https://{host}")
    return origins


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env_bool("DJANGO_DEBUG", False)

# SECURITY WARNING: keep the secret key used in production secret!
DEV_FALLBACK_SECRET_KEY = "django-insecure-development-only-key-change-me"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()

if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = DEV_FALLBACK_SECRET_KEY
    else:
        raise RuntimeError(
            "DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is False."
        )

if not DEBUG and is_weak_secret_key(SECRET_KEY):
    raise RuntimeError(
        "DJANGO_SECRET_KEY must be a strong random value in production "
        "(>= 50 chars, >= 5 unique chars, not django-insecure-*)."
    )

ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    "127.0.0.1,localhost,testserver" if (DEBUG or RUNNING_TESTS) else "",
)

PUBLIC_SITE_DOMAIN = normalize_host(os.getenv("PUBLIC_SITE_DOMAIN", ""))
ADMIN_SITE_DOMAIN = normalize_host(os.getenv("ADMIN_SITE_DOMAIN", ""))

configured_hosts = [normalize_host(host) for host in ALLOWED_HOSTS]
domain_hosts = unique_list(
    configured_hosts + [PUBLIC_SITE_DOMAIN, ADMIN_SITE_DOMAIN]
)
domain_hosts_with_aliases = unique_list(
    domain_hosts
    + [
        alias
        for host in domain_hosts
        for alias in host_aliases(host)
    ]
)

ALLOWED_HOSTS = unique_list(
    configured_hosts + domain_hosts_with_aliases
)

if not ALLOWED_HOSTS and not DEBUG and not RUNNING_TESTS:
    raise RuntimeError(
        "DJANGO_ALLOWED_HOSTS must include at least one hostname when "
        "DJANGO_DEBUG is False."
    )


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'portfolio',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'portfolio.context_processors.global_settings',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

if os.getenv("DB_ENGINE") == "django.db.backends.postgresql":
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "portfolio_db"),
        "USER": os.getenv("DB_USER", "portfolio_user"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }

DB_CONN_MAX_AGE = env_int("DB_CONN_MAX_AGE", 0 if DEBUG else 60)
DATABASES["default"]["CONN_MAX_AGE"] = max(DB_CONN_MAX_AGE, 0)
DATABASES["default"]["CONN_HEALTH_CHECKS"] = env_bool(
    "DB_CONN_HEALTH_CHECKS",
    not DEBUG,
)

if DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql":
    db_connect_timeout = env_int("DB_CONNECT_TIMEOUT", 10)
    db_statement_timeout_ms = env_int("DB_STATEMENT_TIMEOUT_MS", 15000)
    db_options = (os.getenv("DB_OPTIONS", "") or "").strip()

    options_parts = [db_options] if db_options else []
    if db_statement_timeout_ms > 0:
        options_parts.append(f"-c statement_timeout={db_statement_timeout_ms}")

    postgres_options = {}
    if db_connect_timeout > 0:
        postgres_options["connect_timeout"] = db_connect_timeout
    if options_parts:
        postgres_options["options"] = " ".join(options_parts)

    if postgres_options:
        DATABASES["default"]["OPTIONS"] = postgres_options

if (
    not DEBUG
    and not RUNNING_TESTS
    and DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3"
    and env_bool("DISALLOW_SQLITE_IN_PRODUCTION", True)
):
    raise RuntimeError(
        "SQLite is disabled for production mode. Set DB_ENGINE to "
        "django.db.backends.postgresql or set DISALLOW_SQLITE_IN_PRODUCTION=False "
        "to override."
    )


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files (User uploaded files)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type

# REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Settings - Only allow your portfolio website
CORS_ALLOWED_ORIGINS = []

if DEBUG or RUNNING_TESTS:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

domain_origins = domains_to_origins(domain_hosts_with_aliases)
if domain_origins:
    CORS_ALLOWED_ORIGINS = unique_list(CORS_ALLOWED_ORIGINS + domain_origins)

extra_cors_origins = env_list("CORS_ALLOWED_ORIGINS")
if extra_cors_origins:
    CORS_ALLOWED_ORIGINS = unique_list(CORS_ALLOWED_ORIGINS + extra_cors_origins)

CORS_ALLOW_CREDENTIALS = env_bool("CORS_ALLOW_CREDENTIALS", False)

cors_allowed_methods = [
    method.upper() for method in env_list("CORS_ALLOWED_METHODS", "GET,POST,OPTIONS")
]
CORS_ALLOW_METHODS = cors_allowed_methods or ["GET", "POST", "OPTIONS"]

CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS",
    (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000"
    )
    if (DEBUG or RUNNING_TESTS)
    else "",
)

if domain_origins:
    CSRF_TRUSTED_ORIGINS = unique_list(CSRF_TRUSTED_ORIGINS + domain_origins)

# API Key for additional security (Generate a random key for production)
API_KEY = os.getenv('PORTFOLIO_API_KEY', '')
TINYMCE_API_KEY = os.getenv('TINYMCE_API_KEY', 'no-api-key')

SECURE_SSL_REDIRECT = os.getenv(
    'SECURE_SSL_REDIRECT',
    'True' if not DEBUG else 'False',
).lower() in {'1', 'true', 'yes', 'on'}

SESSION_COOKIE_SECURE = env_bool(
    'SESSION_COOKIE_SECURE',
    not DEBUG or SECURE_SSL_REDIRECT,
)
CSRF_COOKIE_SECURE = env_bool(
    'CSRF_COOKIE_SECURE',
    not DEBUG or SECURE_SSL_REDIRECT,
)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
CSRF_COOKIE_SAMESITE = os.getenv('CSRF_COOKIE_SAMESITE', 'Lax')
SECURE_CONTENT_TYPE_NOSNIFF = True

USE_X_FORWARDED_HOST = env_bool(
    'USE_X_FORWARDED_HOST',
    not DEBUG,
)
if env_bool('TRUST_X_FORWARDED_PROTO', not DEBUG):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

TRUST_X_FORWARDED_FOR = env_bool('TRUST_X_FORWARDED_FOR', False)

SECURE_HSTS_SECONDS = int(
    os.getenv('SECURE_HSTS_SECONDS', '31536000' if not DEBUG else '0')
)
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv(
    'SECURE_HSTS_INCLUDE_SUBDOMAINS',
    'True' if not DEBUG else 'False',
).lower() in {'1', 'true', 'yes', 'on'}
SECURE_HSTS_PRELOAD = os.getenv(
    'SECURE_HSTS_PRELOAD',
    'True' if not DEBUG else 'False',
).lower() in {'1', 'true', 'yes', 'on'}
SECURE_REFERRER_POLICY = os.getenv(
    'SECURE_REFERRER_POLICY',
    'strict-origin-when-cross-origin',
)
SECURE_CROSS_ORIGIN_OPENER_POLICY = os.getenv(
    'SECURE_CROSS_ORIGIN_OPENER_POLICY',
    'same-origin',
)
SECURE_CROSS_ORIGIN_RESOURCE_POLICY = os.getenv(
    'SECURE_CROSS_ORIGIN_RESOURCE_POLICY',
    'same-origin',
)
X_FRAME_OPTIONS = os.getenv('X_FRAME_OPTIONS', 'DENY')

LOGIN_URL = '/admin/login/'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/admin/login/'

# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
