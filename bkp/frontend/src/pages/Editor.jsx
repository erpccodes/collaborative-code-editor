import React, { useEffect, useState } from 'react';
import { connectWebSocket, sendCodeUpdate } from '../services/websocket'; 

const Editor = () => {
  const [code, setCode] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      connectWebSocket(token, (msg) => {
        setCode(msg.content); // sync code updates
      });
    }
  }, [token]);

  const handleChange = (e) => {
    setCode(e.target.value);
    sendCodeUpdate({ content: e.target.value });
  };

  return (
    <div>
      <h2>Collaborative Editor</h2>
      <textarea
        style={{ width: '80%', height: '400px' }}
        value={code}
        onChange={handleChange}
      />
    </div>
  );
};

export default Editor;
