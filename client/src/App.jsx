import { useEffect, useMemo, useState } from 'react';
import { fetchPortfolioData } from './api/portfolioApi';
import { hydratePortfolioDom } from './api/hydratePortfolio';

const CORE_LEGACY_SCRIPTS = [
  '/static/js/script.js',
  '/static/js/modal.js',
];

const DEFERRED_LEGACY_SCRIPTS = [
  '/static/js/sounds.js',
  '/static/js/faq.js',
  '/static/js/projects.js',
  '/static/js/contact.js',
  '/static/js/technology.js',
  '/static/js/blog.js',
  '/static/js/about.js',
  '/static/js/roadmap.js',
];

const DEFERRED_SCRIPT_GAP_MS = 50;
const DEFERRED_FALLBACK_DELAY_MS = 10000;

function App() {
  const [markup, setMarkup] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    fetch('/portfolio-body.html', { signal: controller.signal })
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
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!markup) return undefined;

    const appendedScripts = [];
    let cancelled = false;
    let cancelDeferredLoad = null;
    let removeDeferredTriggers = null;
    let deferredLoaded = false;

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

    const loadScriptsSequentially = async (scripts) => {
      for (const src of scripts) {
        await loadScript(src);
      }
    };

    const pause = (ms) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const scheduleDeferred = (callback) => {
      let cancelIdleOrTimeout = null;
      let onLoad = null;

      const run = () => {
        if (cancelled || deferredLoaded) {
          return;
        }

        if ('requestIdleCallback' in window) {
          const id = window.requestIdleCallback(() => {
            void callback();
          }, { timeout: 3500 });
          cancelIdleOrTimeout = () => window.cancelIdleCallback(id);
          return;
        }

        const id = window.setTimeout(() => {
          void callback();
        }, 1200);
        cancelIdleOrTimeout = () => window.clearTimeout(id);
      };

      if (document.readyState === 'complete') {
        run();
      } else {
        onLoad = () => {
          run();
        };
        window.addEventListener('load', onLoad, { once: true });
      }

      const fallbackId = window.setTimeout(() => {
        void callback();
      }, DEFERRED_FALLBACK_DELAY_MS);

      return () => {
        if (onLoad) {
          window.removeEventListener('load', onLoad);
        }
        window.clearTimeout(fallbackId);
        if (cancelIdleOrTimeout) {
          cancelIdleOrTimeout();
        }
      };
    };

    const loadDeferredScripts = async () => {
      if (cancelled || deferredLoaded) {
        return;
      }

      deferredLoaded = true;
      if (removeDeferredTriggers) {
        removeDeferredTriggers();
        removeDeferredTriggers = null;
      }

      for (const src of DEFERRED_LEGACY_SCRIPTS) {
        if (cancelled) {
          return;
        }

        try {
          await loadScript(src);
        } catch {
          // Keep rendering the page even if a deferred script fails to load.
        }

        await pause(DEFERRED_SCRIPT_GAP_MS);
      }
    };

    const bindDeferredTriggers = () => {
      const triggerConfigs = [
        { target: window, type: 'pointerdown', options: { once: true, passive: true } },
        { target: window, type: 'touchstart', options: { once: true, passive: true } },
        { target: window, type: 'scroll', options: { once: true, passive: true } },
        { target: window, type: 'keydown', options: { once: true } },
      ];

      const onTrigger = () => {
        void loadDeferredScripts();
      };

      triggerConfigs.forEach(({ target, type, options }) => {
        target.addEventListener(type, onTrigger, options);
      });

      return () => {
        triggerConfigs.forEach(({ target, type, options }) => {
          target.removeEventListener(type, onTrigger, options);
        });
      };
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

      await loadScriptsSequentially(CORE_LEGACY_SCRIPTS);

      if (cancelled) {
        return;
      }

      removeDeferredTriggers = bindDeferredTriggers();
      cancelDeferredLoad = scheduleDeferred(loadDeferredScripts);
    };

    initializeLegacyScripts().catch(() => {
      // Keep rendering the page even if a non-critical legacy script fails.
    });

    return () => {
      cancelled = true;
      if (cancelDeferredLoad) {
        cancelDeferredLoad();
      }
      if (removeDeferredTriggers) {
        removeDeferredTriggers();
      }
      appendedScripts.forEach((script) => script.remove());
    };
  }, [markup]);

  const content = useMemo(() => ({ __html: markup }), [markup]);

  return <div dangerouslySetInnerHTML={content} />;
}

export default App;
