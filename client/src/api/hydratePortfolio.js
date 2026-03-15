function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeUrl(url, fallback = '#') {
  if (!url) return fallback;
  return url;
}

function formatDateRange(startDate, endDate, currentlyWorking) {
  if (!startDate) return 'Timeline not specified';

  const start = new Date(startDate);
  const startLabel = Number.isNaN(start.getTime())
    ? String(startDate)
    : start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (currentlyWorking) {
    return `${startLabel} - Present`;
  }

  if (!endDate) {
    return startLabel;
  }

  const end = new Date(endDate);
  const endLabel = Number.isNaN(end.getTime())
    ? String(endDate)
    : end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return `${startLabel} - ${endLabel}`;
}

function setText(selector, text) {
  const element = document.querySelector(selector);
  if (element && text) {
    element.textContent = text;
  }
}

function updateProfile(profile) {
  if (!profile) return;

  setText('.hero-heading', `I am ${profile.full_name || 'Roshan Damor'}`);
  setText('.text-gradient', profile.title || 'Software Developer');
  setText('.about-description', profile.bio || 'A full-stack developer building scalable products.');

  const contactValues = document.querySelectorAll('.contact-value');
  if (contactValues.length >= 3) {
    contactValues[0].textContent = profile.email || contactValues[0].textContent;
    contactValues[1].textContent = profile.phone || contactValues[1].textContent;
    contactValues[2].textContent = profile.location || contactValues[2].textContent;
  }

  const footerContactValues = document.querySelectorAll('.footer-contact-list li span');
  if (footerContactValues.length >= 3) {
    footerContactValues[0].textContent = profile.email || footerContactValues[0].textContent;
    footerContactValues[1].textContent = profile.phone || footerContactValues[1].textContent;
    footerContactValues[2].textContent = profile.location || footerContactValues[2].textContent;
  }

  const socials = {
    github: profile.github,
    linkedin: profile.linkedin,
    twitter: profile.twitter,
  };

  document.querySelectorAll('.footer-social-btn').forEach((link) => {
    const label = (link.getAttribute('aria-label') || '').toLowerCase();
    if (label.includes('github') && socials.github) {
      link.href = socials.github;
    }
    if (label.includes('linkedin') && socials.linkedin) {
      link.href = socials.linkedin;
    }
    if ((label.includes('twitter') || label.includes('x')) && socials.twitter) {
      link.href = socials.twitter;
    }
  });
}

function updateSkills(skills) {
  if (!skills.length) return;

  const techGrid = document.querySelector('.tech-grid');
  if (!techGrid) return;

  const groups = new Map();
  skills
    .slice(0, 24)
    .forEach((skill) => {
      const key = skill.skill_level_display || skill.skill_level || 'Skills';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(skill.name);
    });

  const iconCycle = ['fa-laptop-code', 'fa-server', 'fa-cloud', 'fa-tools'];
  const cards = [...groups.entries()].slice(0, 4);

  if (!cards.length) return;

  techGrid.innerHTML = cards
    .map(([groupName, items], index) => {
      const icon = iconCycle[index % iconCycle.length];
      const listItems = items.slice(0, 9).map((name) => `<li>${escapeHtml(name)}</li>`).join('');

      return `
        <div class="tech-card">
          <div class="tech-icon-wrapper">
            <i class="fas ${icon}"></i>
          </div>
          <h3 class="tech-card-title">${escapeHtml(groupName)}</h3>
          <ul class="skills-list">${listItems}</ul>
        </div>
      `;
    })
    .join('');
}

function updateProjects(projects) {
  if (!projects.length) return;

  const slider = document.querySelector('.projects-slider');
  if (!slider) return;

  const items = projects.slice(0, 6);

  slider.innerHTML = items
    .map((project, index) => {
      const techBadges = (project.technologies_list || [])
        .slice(0, 6)
        .map((tech) => `<span class="project-tech-badge">${escapeHtml(tech)}</span>`)
        .join('');

      const categoryName = project.category?.name || 'Project';
      const imageUrl = project.thumbnail || '/static/images/ecom.jpg';
      const projectName = project.project_name || project.title;
      const projectLink = safeUrl(project.live_url || project.demo_url);
      const githubLink = safeUrl(project.github_url);

      return `
        <div class="project-card ${index === 0 ? 'active' : ''}" data-index="${index}">
          <div class="project-content">
            <span class="project-nickname">${escapeHtml(projectName)}</span>
            <h3 class="project-title">${escapeHtml(project.title)}</h3>
            <p class="project-description">${escapeHtml(project.description || '')}</p>
            <div class="project-tech-stack">${techBadges}</div>
            <div class="project-buttons">
              <a href="${escapeHtml(projectLink)}" class="btn btn-primary project-btn" target="_blank" rel="noopener noreferrer">Live Preview</a>
              <a href="${escapeHtml(githubLink)}" class="github-btn" target="_blank" rel="noopener noreferrer" aria-label="Open project repository"><i class="fab fa-github"></i></a>
            </div>
          </div>
          <div class="project-image">
            <span class="project-category">${escapeHtml(categoryName)}</span>
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(project.title)}">
          </div>
        </div>
      `;
    })
    .join('');
}

function updateExperience(experience) {
  if (!experience.length) return;

  const timeline = document.querySelector('.roadmap-timeline');
  if (!timeline) return;

  const items = experience.slice(0, 6);
  const timelineLine = '<div class="timeline-line"></div>';

  const rows = items
    .map((item, index) => {
      const sideClass = index % 2 === 0 ? 'roadmap-left' : 'roadmap-right';
      const description = item.short_description || item.detailed_description || '';

      return `
        <div class="roadmap-item ${sideClass}">
          <div class="roadmap-card">
            <span class="roadmap-date">${escapeHtml(formatDateRange(item.start_date, item.end_date, item.currently_working))}</span>
            <h3 class="roadmap-title">${escapeHtml(item.position)}</h3>
            <p class="roadmap-description">${escapeHtml(description)}</p>
          </div>
          <div class="roadmap-dot"></div>
        </div>
      `;
    })
    .join('');

  timeline.innerHTML = `${timelineLine}${rows}`;
}

export function hydratePortfolioDom(data) {
  updateProfile(data.profile);
  updateSkills(data.skills || []);
  updateProjects(data.projects || []);
  updateExperience(data.experience || []);
}
