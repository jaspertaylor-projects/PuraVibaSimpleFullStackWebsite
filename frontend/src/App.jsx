// frontend/src/App.jsx
// Purpose: Display backend API data with a manual refresh, using a relative API path so Vite's proxy routes requests to the backend.
// Imports From: ./App.css, ./theme.js
// Exported To: None
import React, { useState, useEffect } from 'react';
import './App.css';
import theme from './theme.js';

export default function App() {
  const [apiData, setApiData] = useState({ message: 'Loading...', timestamp: '' });
  const [error, setError] = useState('');

  const fetchApiData = () => {
    setError('');
    // Use a relative path so the Vite dev server proxy forwards to the backend
    fetch('/api/hello')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch from API');
        return res.json();
      })
      .then((data) => setApiData(data))
      .catch((err) => setError(`Error: ${err.message}. Is the backend running?`));
  };

  useEffect(() => {
    fetchApiData();
  }, []);

  // CSS-in-JS styles derived from the theme file
  const styles = {
    appContainer: {
      backgroundColor: theme.background,
      color: theme.textPrimary,
    },
    appHeader: {
      backgroundColor: theme.secondary,
    },
    appTitle: {
      color: theme.primary,
    },
    appSubtitle: {
      color: theme.textSecondary,
    },
    apiCard: {
      backgroundColor: theme.cardBackground,
    },
    apiCardErrorMessage: {
      color: theme.error,
    },
    apiCardRefreshButton: {
      backgroundColor: theme.buttonBackground,
      color: theme.buttonText,
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
  };

  return (
    <div className="app-container" style={styles.appContainer}>
      <header className="app-header" style={styles.appHeader}>
        <h1 className="app-title" style={styles.appTitle}>
          Full-Stack Docker App
        </h1>
        <p className="app-subtitle" style={styles.appSubtitle}>
          FastAPI + React with Hot-Reloading Test
        </p>
      </header>
      <main className="api-card" style={styles.apiCard}>
        <h2 className="api-card__title">Message from Backend</h2>
        {error ? (
          <p className="api-card__error-message" style={styles.apiCardErrorMessage}>
            {error}
          </p>
        ) : (
          <>
            <p className="api-card__message">"{apiData.message}"</p>
            <p className="api-card__timestamp">Timestamp: {apiData.timestamp}</p>
          </>
        )}
        <button
          className="api-card__refresh-button"
          style={styles.apiCardRefreshButton}
          onClick={fetchApiData}
        >
          Refresh Data
        </button>
      </main>
    </div>
  );
}
