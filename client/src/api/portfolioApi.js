const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TIME_API = typeof window !== 'undefined' ? window : globalThis;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_API_TIMEOUT_MS = parsePositiveInt(import.meta.env.VITE_API_TIMEOUT_MS, 7000);
const DEFAULT_API_RETRY_ATTEMPTS = parsePositiveInt(import.meta.env.VITE_API_RETRY_ATTEMPTS, 1);

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

function settledValue(result) {
  if (result.status !== 'fulfilled') {
    return null;
  }

  return result.value;
}

export async function fetchPortfolioData() {
  const [profileResult, projectsResult, skillsResult, experienceResult] = await Promise.allSettled([
    requestJson('/profile/'),
    requestJson('/projects/featured/'),
    requestJson('/skills/top/'),
    requestJson('/experience/'),
  ]);

  const profileData = settledValue(profileResult);
  const projectsData = settledValue(projectsResult);
  const skillsData = settledValue(skillsResult);
  const experienceData = settledValue(experienceResult);

  return {
    profile: profileData && !Array.isArray(profileData) ? profileData : null,
    projects: unwrapResults(projectsData),
    skills: unwrapResults(skillsData),
    experience: unwrapResults(experienceData),
  };
}
