import { Client } from "@stomp/stompjs";

let stompClient = null;
let currentRoom = "collaboration"; // default room
let username = null;

/**
 * Connects WebSocket and subscribes to:
 * - Room updates (/topic/room.{room})
 * - Invitations (/topic/invite.{username})
 */
export const connectWebSocket = (token, onMessageReceived, onInviteReceived) => {
  if (stompClient && stompClient.active) {
    console.log("⚠️ Already connected, skipping new connection");
    return;
  }

  username = getUsernameFromToken(token);

  stompClient = new Client({
    brokerURL: "ws://localhost:8585/ws",
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    debug: (str) => console.log("STOMP Debug:", str),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      console.log("✅ Connected to WebSocket as", username);

      // Subscribe to collaboration room (default)
      stompClient.subscribe(`/topic/room.${currentRoom}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          onMessageReceived(payload);
        } catch (err) {
          console.error("❌ Failed to parse room message", err, message.body);
        }
      });

      // Subscribe to personal invitation channel
      stompClient.subscribe(`/topic/invite.${username}`, (message) => {
        try {
          const invite = JSON.parse(message.body);
          console.log("📨 Received invite:", invite);
          if (onInviteReceived) onInviteReceived(invite);
        } catch (err) {
          console.error("❌ Failed to parse invite message", err, message.body);
        }
      });
    },

    onStompError: (frame) => {
      console.error("❌ STOMP error:", frame.headers["message"]);
    },
  });

  stompClient.activate();
};

/**
 * Send code update to current collaboration room
 */
export const sendCodeUpdate = (codeMessage) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/app/room.${currentRoom}`,
      body: JSON.stringify(codeMessage),
    });
  } else {
    console.warn("⚠️ Cannot send, WebSocket not connected");
  }
};

/**
 * Send a collaboration invite to another user
 */
export const sendInvite = (fromUser, toUser) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: "/app/invite",
      body: JSON.stringify({ fromUser, toUser }),
    });
    console.log(`📨 Invite sent from ${fromUser} to ${toUser}`);
  } else {
    console.warn("⚠️ Cannot send invite, not connected");
  }
};

/**
 * Accept an invite (join the shared room)
 */
export const acceptInvite = (roomName) => {
  currentRoom = roomName;
  console.log(`✅ Joined room: ${roomName}`);
};

/**
 * Disconnect WebSocket
 */
export const disconnectWebSocket = () => {
  if (stompClient && stompClient.active) {
    stompClient.deactivate();
    stompClient = null;
    console.log("🔌 WebSocket disconnected");
  }
};

/**
 * Decode JWT to get username
 */
const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.username || payload.name || "anonymous";
  } catch (err) {
    console.error("❌ Failed to decode token", err);
    return "anonymous";
  }
};
