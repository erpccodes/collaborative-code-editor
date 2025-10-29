// src/pages/Signin.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Signin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8383/api/auth/signin', credentials, {
        headers: { 'Content-Type': 'application/json' }
      });
      // Save the token to local storage or state management
      localStorage.setItem('token', response.data.token);
      navigate('/'); // Redirect to home or dashboard
    } catch (err) {
      setError(err.response?.data || 'Signin failed');
    }
  };

  return (
    <Layout>
      <h2>Sign In</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input type="text" name="username" value={credentials.username} onChange={handleChange} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" name="password" value={credentials.password} onChange={handleChange} required />
        </div>
        <button type="submit">Sign In</button>
      </form>
    </Layout>
  );
};

export default Signin;
