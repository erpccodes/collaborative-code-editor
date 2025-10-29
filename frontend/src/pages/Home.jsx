// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); // get token after signin

  useEffect(() => {
    if (token) {
      fetch('http://localhost:8383/api/hello', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then((data) => setMessage(data.message))
        .catch((err) => {
          console.error(err);
          setMessage('⚠️ Unauthorized. Please Sign In.');
        });
    } else {
      setMessage('Please Sign In first.');
    }
  }, [token]);

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>Welcome to the Collaborative Code Editor</h1>
      <p>This is the home page.</p>
      <p><strong>Backend says:</strong> {message}</p>

      {token ? (
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
      ) : (
        <p style={{ marginTop: '1.5rem' }}>
          Please <a href="/signin">Sign In</a> to access the editor.
        </p>
      )}
    </div>
  );
};

export default Home;
