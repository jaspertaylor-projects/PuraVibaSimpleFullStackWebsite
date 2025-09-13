import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiData, setApiData] = useState({ message: 'Loading...', timestamp: '' });
  const [error, setError] = useState('');

  const fetchApiData = () => {
    setError('');
    // The API is available on localhost:8000 because we exposed the port in docker-compose
    fetch('http://localhost:8000/api/hello')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch from API');
        return res.json();
      })
      .then(data => setApiData(data))
      .catch(err => setError(`Error: ${err.message}. Is the backend running?`));
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchApiData();
  }, []);

  return (
    <div className="container">
      <header>
        <h1>Full-Stack Docker App</h1>
        <p>FastAPI + React with Hot-Reloading Test</p>
      </header>
      <main className="api-card">
        <h2>Message from Backend</h2>
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <>
            <p className="api-message">"{apiData.message}"</p>
            <p className="api-timestamp">Timestamp: {apiData.timestamp}</p>
          </>
        )}
        <button onClick={fetchApiData}>Refresh Data</button>
      </main>
    </div>
  );
}

export default App;
