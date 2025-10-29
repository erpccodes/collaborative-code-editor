// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8383/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>Welcome to the Collaborative Code Editor</h1>
      <p>This is the home page.</p>
      <p><strong>Backend says:</strong> {message}</p>

      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={() => navigate('/editor')}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '8px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none'
          }}
        >
          🚀 Open Collaborative Editor
        </button>
      </div>
    </div>
  );
};

export default Home;
