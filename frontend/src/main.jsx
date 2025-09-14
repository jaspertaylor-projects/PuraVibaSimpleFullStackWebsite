// frontend/src/main.jsx
// Purpose: Bootstrap the React app, install client error reporting, and wrap App in an ErrorBoundary.
// Imports From: ./App.jsx, ./errors/ErrorBoundary.jsx, ./errors/clientErrorReporter.js, ./theme.js
// Exported To: None
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './errors/ErrorBoundary.jsx';
import installClientErrorReporter from './errors/clientErrorReporter.js';
import theme from './theme.js';

// Apply theme colors as CSS variables to the root element
// This makes theme colors available to the global stylesheet (App.css)
Object.entries(theme).forEach(([key, value]) => {
  document.documentElement.style.setProperty(`--color-${key}`, value);
});

installClientErrorReporter();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
