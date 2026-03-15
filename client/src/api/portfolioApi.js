const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

function withBase(path) {
  return `${API_BASE_URL}${path}`;
}

async function requestJson(path) {
  const response = await fetch(withBase(path), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${path}`);
  }

  return response.json();
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

export async function fetchPortfolioData() {
  const [profileData, projectsData, skillsData, experienceData] = await Promise.all([
    requestJson('/profile/').catch(() => null),
    requestJson('/projects/?featured=true').catch(() => null),
    requestJson('/skills/').catch(() => null),
    requestJson('/experience/').catch(() => null),
  ]);

  return {
    profile: profileData && !Array.isArray(profileData) ? profileData : null,
    projects: unwrapResults(projectsData),
    skills: unwrapResults(skillsData),
    experience: unwrapResults(experienceData),
  };
}
