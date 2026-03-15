import { useEffect, useMemo, useState } from 'react';
import { fetchPortfolioData } from './api/portfolioApi';
import { hydratePortfolioDom } from './api/hydratePortfolio';

const LEGACY_SCRIPTS = [
  '/static/js/script.js',
  '/static/js/technology.js',
  '/static/js/blog.js',
  '/static/js/about.js',
  '/static/js/faq.js',
  '/static/js/roadmap.js',
  '/static/js/projects.js',
  '/static/js/contact.js',
  '/static/js/sounds.js',
  '/static/js/modal.js',
];

function App() {
  const [markup, setMarkup] = useState('');

  useEffect(() => {
    let active = true;

    fetch('/portfolio-body.html')
      .then((response) => response.text())
      .then((html) => {
        if (active) {
          setMarkup(html);
        }
      })
      .catch(() => {
        if (active) {
          setMarkup('<main><p>Unable to load portfolio content.</p></main>');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!markup) return undefined;

    const appendedScripts = [];
    let cancelled = false;

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-legacy-src="${src}"]`);
        if (existing) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.setAttribute('data-legacy-src', src);
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
        appendedScripts.push(script);
      });

    const initializeLegacyScripts = async () => {
      try {
        const apiData = await fetchPortfolioData();
        if (!cancelled) {
          hydratePortfolioDom(apiData);
        }
      } catch {
        // Keep static fallback content if API is not reachable.
      }

      for (const src of LEGACY_SCRIPTS) {
        // Load scripts in order because some files depend on previous global setup.
        // eslint-disable-next-line no-await-in-loop
        await loadScript(src);
      }

      if (cancelled) {
        return;
      }

      document.dispatchEvent(new Event('DOMContentLoaded'));
    };

    initializeLegacyScripts().catch(() => {
      // Keep rendering the page even if a non-critical legacy script fails.
    });

    return () => {
      cancelled = true;
      appendedScripts.forEach((script) => script.remove());
    };
  }, [markup]);

  const content = useMemo(() => ({ __html: markup }), [markup]);

  return <div dangerouslySetInnerHTML={content} />;
}

export default App;
