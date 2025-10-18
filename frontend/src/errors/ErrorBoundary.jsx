// frontend/src/errors/ErrorBoundary.jsx
// Purpose: Catch React render lifecycle errors and report them to the backend so they land in backend-error.log.
// Imports From: ../theme.js
// Exported To: frontend/src/main.jsx
import React from 'react';
import theme from '../theme.js';

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
      const styles = {
        errorBoundaryContainer: {
          backgroundColor: theme.globalBackground,
          color: theme.textPrimary,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif',
          boxSizing: 'border-box',
        },
        errorBoundaryTitle: {
          color: theme.error,
        },
        errorBoundaryMessage: {
          color: theme.textSecondary,
          fontFamily: 'monospace',
          backgroundColor: theme.secondary,
          padding: '1rem',
          borderRadius: '8px',
          maxWidth: '800px',
          wordBreak: 'break-all',
          textAlign: 'left',
        },
      };

      return (
        <div className="error-boundary" style={styles.errorBoundaryContainer}>
          <h1 style={styles.errorBoundaryTitle}>Something went wrong</h1>
          <p style={styles.errorBoundaryMessage}>{this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
