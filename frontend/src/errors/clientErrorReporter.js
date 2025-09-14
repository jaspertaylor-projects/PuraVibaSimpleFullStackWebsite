// frontend/src/errors/clientErrorReporter.js
// Purpose: Install global listeners to capture browser runtime errors and POST them to the backend /api/logs/frontend endpoint.
// Imports From: None
// Exported To: frontend/src/main.jsx
let installed = false;

function safeFetch(url, payload) {
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export default function installClientErrorReporter() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const endpoint = '/api/logs/frontend';

  window.addEventListener(
    'error',
    (event) => {
      const payload = {
        message: event?.error?.message || event?.message || 'UnknownError',
        stack: event?.error?.stack || null,
        source: event?.filename || null,
        line: Number.isFinite(event?.lineno) ? event.lineno : null,
        col: Number.isFinite(event?.colno) ? event.colno : null,
        href: window.location?.href || null,
        userAgent: navigator.userAgent || null,
      };
      safeFetch(endpoint, payload);
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event?.reason;
      const payload = {
        message:
          (reason && (reason.message || String(reason))) || 'UnhandledRejection',
        stack: reason && reason.stack ? reason.stack : null,
        source: null,
        line: null,
        col: null,
        href: window.location?.href || null,
        userAgent: navigator.userAgent || null,
      };
      safeFetch(endpoint, payload);
    },
    true
  );
}
