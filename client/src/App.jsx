import { useEffect, useMemo, useState } from 'react';
import { fetchPortfolioData } from './api/portfolioApi';
import { hydratePortfolioDom } from './api/hydratePortfolio';

const CORE_LEGACY_SCRIPTS = [
  '/static/js/script.js',
  '/static/js/faq.js',
  '/static/js/projects.js',
  '/static/js/contact.js',
  '/static/js/sounds.js',
  '/static/js/modal.js',
];

const DEFERRED_LEGACY_SCRIPTS = [
  '/static/js/technology.js',
  '/static/js/blog.js',
  '/static/js/about.js',
  '/static/js/roadmap.js',
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
    let cancelDeferredLoad = null;

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-legacy-src="${src}"]`);
        if (existing) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.setAttribute('data-legacy-src', src);
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
        appendedScripts.push(script);
      });

    const scheduleDeferred = (callback) => {
      if ('requestIdleCallback' in window) {
        const id = window.requestIdleCallback(callback, { timeout: 1200 });
        return () => window.cancelIdleCallback(id);
      }

      const id = window.setTimeout(callback, 200);
      return () => window.clearTimeout(id);
    };

    const initializeLegacyScripts = async () => {
      try {
        const apiData = await fetchPortfolioData();
        if (!cancelled) {
          hydratePortfolioDom(apiData);
        }
      } catch {
        // Keep static fallback content if API is not reachable.
      }

      await Promise.all(CORE_LEGACY_SCRIPTS.map((src) => loadScript(src)));

      if (cancelled) {
        return;
      }

      cancelDeferredLoad = scheduleDeferred(() => {
        if (cancelled) {
          return;
        }

        Promise.all(DEFERRED_LEGACY_SCRIPTS.map((src) => loadScript(src))).catch(() => {
          // Keep rendering the page even if deferred scripts fail to load.
        });
      });
    };

    initializeLegacyScripts().catch(() => {
      // Keep rendering the page even if a non-critical legacy script fails.
    });

    return () => {
      cancelled = true;
      if (cancelDeferredLoad) {
        cancelDeferredLoad();
      }
      appendedScripts.forEach((script) => script.remove());
    };
  }, [markup]);

  const content = useMemo(() => ({ __html: markup }), [markup]);

  return <div dangerouslySetInnerHTML={content} />;
}

export default App;
