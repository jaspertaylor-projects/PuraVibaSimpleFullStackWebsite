// frontend/src/errors/ErrorBoundary.jsx
// Purpose: Catch React render lifecycle errors and report them to the backend so they land in backend-error.log.
// Imports From: None
// Exported To: frontend/src/main.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'RenderError' };
  }

  componentDidCatch(error, info) {
    try {
      fetch('/api/logs/frontend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message || 'RenderError',
          stack: error?.stack || null,
          source: 'ReactErrorBoundary',
          line: null,
          col: null,
          href: window.location?.href || null,
          userAgent: navigator.userAgent || null,
          componentStack: info?.componentStack || null,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong.</h1>
          <p>{this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
