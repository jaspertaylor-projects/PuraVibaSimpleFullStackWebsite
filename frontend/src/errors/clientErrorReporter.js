// frontend/src/errors/clientErrorReporter.js
// Purpose: Install global listeners to capture browser runtime errors, unhandled promise rejections, and console errors, and POST them to the backend /api/logs/frontend endpoint.
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

  const wrapConsoleMethod = (method) => {
    const original = console[method];
    console[method] = (...args) => {
      original.apply(console, args);

      const message = args
        .map((arg) => {
          if (arg instanceof Error) {
            return arg.stack || arg.message;
          }
          try {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          } catch (e) {
            return '[Unserializable Object]';
          }
        })
        .join(' ');

      // If an error object was not passed, generate a stack trace.
      const stack =
        args.find((arg) => arg instanceof Error)?.stack || new Error().stack;

      const payload = {
        message: `console.${method}: ${message}`,
        stack,
        source: 'console',
        line: null,
        col: null,
        href: window.location?.href || null,
        userAgent: navigator.userAgent || null,
      };
      safeFetch(endpoint, payload);
    };
  };

  wrapConsoleMethod('error');
  wrapConsoleMethod('warn');
}
