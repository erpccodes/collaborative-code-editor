import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

export const connectWebSocket = (token, onMessageReceived) => {
  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(`http://localhost:8585/ws/code-editor?token=${token}`), // backend WS URL

    connectHeaders: {
      Authorization: `Bearer ${token}`, // optional if you prefer headers
    },

    debug: (str) => {
      console.log(str);
    },

    onConnect: () => {
      console.log('✅ Connected to WebSocket');

      // Subscribe to collaboration topic
      stompClient.subscribe('/topic/collaboration', (message) => {
        onMessageReceived(JSON.parse(message.body));
      });
    },

    onDisconnect: () => {
      console.log('❌ Disconnected');
    },
  });

  stompClient.activate();
};

export const sendCodeUpdate = (codeMessage) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: '/app/edit',
      body: JSON.stringify(codeMessage),
    });
  }
};
