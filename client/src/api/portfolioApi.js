const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TIME_API = typeof window !== 'undefined' ? window : globalThis;
const CACHE_KEY = 'portfolio-bootstrap-cache-v1';

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_API_TIMEOUT_MS = parsePositiveInt(import.meta.env.VITE_API_TIMEOUT_MS, 7000);
const DEFAULT_API_RETRY_ATTEMPTS = parsePositiveInt(import.meta.env.VITE_API_RETRY_ATTEMPTS, 1);
const DEFAULT_BOOTSTRAP_CACHE_TTL_MS = parsePositiveInt(
  import.meta.env.VITE_PORTFOLIO_CACHE_TTL_MS,
  5 * 60 * 1000,
);

let portfolioCache = null;
let portfolioCacheExpiresAt = 0;
let inFlightPortfolioRequest = null;

function withBase(path) {
  return `${API_BASE_URL}${path}`;
}

async function requestJson(path, options = {}) {
  const timeoutMs = parsePositiveInt(options.timeoutMs, DEFAULT_API_TIMEOUT_MS);
  const retryAttempts = parsePositiveInt(options.retryAttempts, DEFAULT_API_RETRY_ATTEMPTS);
  let lastError = null;

  for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = TIME_API.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(withBase(path), {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const serverError = response.status >= 500;
        if (serverError && attempt < retryAttempts) {
          continue;
        }

        throw new Error(`API request failed: ${response.status} ${path}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      const isAbort = error?.name === 'AbortError';
      const isNetwork = error instanceof TypeError;
      const canRetry = attempt < retryAttempts;

      if (!canRetry || (!isAbort && !isNetwork)) {
        throw error;
      }
    } finally {
      TIME_API.clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error(`API request failed: ${path}`);
}

function unwrapResults(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

function getSessionStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function buildPortfolioPayload(payload) {
  const source = payload || {};

  return {
    profile: source.profile && !Array.isArray(source.profile) ? source.profile : null,
    projects: unwrapResults(source.projects),
    skills: unwrapResults(source.skills),
    experience: unwrapResults(source.experience),
  };
}

function readCachedPortfolioPayload() {
  const now = Date.now();

  if (portfolioCache && now < portfolioCacheExpiresAt) {
    return portfolioCache;
  }

  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.expiresAt <= now || !parsed.data) {
      storage.removeItem(CACHE_KEY);
      return null;
    }

    portfolioCache = parsed.data;
    portfolioCacheExpiresAt = parsed.expiresAt;
    return portfolioCache;
  } catch {
    return null;
  }
}

function writeCachedPortfolioPayload(payload) {
  const now = Date.now();
  const expiresAt = now + DEFAULT_BOOTSTRAP_CACHE_TTL_MS;

  portfolioCache = payload;
  portfolioCacheExpiresAt = expiresAt;

  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(
      CACHE_KEY,
      JSON.stringify({
        expiresAt,
        data: payload,
      }),
    );
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
}

function settledValue(result) {
  if (result.status !== 'fulfilled') {
    return null;
  }

  return result.value;
}

export async function fetchPortfolioData() {
  const cachedPayload = readCachedPortfolioPayload();
  if (cachedPayload) {
    return cachedPayload;
  }

  if (inFlightPortfolioRequest) {
    return inFlightPortfolioRequest;
  }

  inFlightPortfolioRequest = (async () => {
    try {
      const bootstrapPayload = await requestJson('/bootstrap/', {
        retryAttempts: Math.max(DEFAULT_API_RETRY_ATTEMPTS, 2),
      });
      const normalized = buildPortfolioPayload(bootstrapPayload);
      writeCachedPortfolioPayload(normalized);
      return normalized;
    } catch {
      const [profileResult, projectsResult, skillsResult, experienceResult] = await Promise.allSettled([
        requestJson('/profile/'),
        requestJson('/projects/featured/'),
        requestJson('/skills/top/'),
        requestJson('/experience/'),
      ]);

      const fallbackPayload = buildPortfolioPayload({
        profile: settledValue(profileResult),
        projects: settledValue(projectsResult),
        skills: settledValue(skillsResult),
        experience: settledValue(experienceResult),
      });

      writeCachedPortfolioPayload(fallbackPayload);
      return fallbackPayload;
    } finally {
      inFlightPortfolioRequest = null;
    }
  })();

  return inFlightPortfolioRequest;
}
