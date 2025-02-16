import React, { useEffect, useState } from 'react';

const Home = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:8383/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Welcome to the Collaborative Code Editor</h1>
      <p>This is the home page.</p>
      <p>Backend says: {message}</p>
    </div>
  );
};

export default Home;
