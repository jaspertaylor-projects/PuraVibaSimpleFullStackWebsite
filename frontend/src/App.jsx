// frontend/src/App.jsx
// Purpose: Display backend API data with a manual refresh, using a relative API path so Vite's proxy routes requests to the backend.
// Imports From: ./App.css
// Exported To: None
import React, { useState, useEffect } from 'react';
import './App.css';

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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Full-Stack Docker App</h1>
        <p className="app-subtitle">FastAPI + React with Hot-Reloading Test</p>
      </header>
      <main className="api-card">
        <h2 className="api-card__title">Message from Backend</h2>
        {error ? (
          <p className="api-card__error-message">{error}</p>
        ) : (
          <>
            <p className="api-card__message">"{apiData.message}"</p>
            <p className="api-card__timestamp">Timestamp: {apiData.timestamp}</p>
          </>
        )}
        <button className="api-card__refresh-button" onClick={fetchApiData}>
          Refresh Data
        </button>
      </main>
    </div>
  );
}
