import { Client } from "@stomp/stompjs";

let stompClient = null;
let currentRoom = null;
let username = null;
let roomSubscription = null;
let onMessageCallback = null;

export const connectWebSocket = (token, onMessageReceived, onInviteReceived) => {
  if (stompClient && stompClient.active) {
    console.log("⚠️ Already connected");
    return;
  }

  username = getUsernameFromToken(token);
  onMessageCallback = onMessageReceived;
  
  console.log("═══════════════════════════════════════");
  console.log("🔌 CONNECTING WebSocket");
  console.log("Username:", username);
  console.log("═══════════════════════════════════════");

  stompClient = new Client({
    brokerURL: "ws://localhost:8585/ws",
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    debug: (str) => {
      if (str.includes('CONNECTED') || str.includes('SUBSCRIBE') || str.includes('MESSAGE')) {
        console.log("STOMP:", str);
      }
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      console.log("═══════════════════════════════════════");
      console.log("✅ WebSocket CONNECTED");
      console.log("User:", username);
      console.log("═══════════════════════════════════════");

      // 1. Subscribe to personal room
      currentRoom = `room-${username}`;
      subscribeToRoom(currentRoom);

      // 2. Subscribe to TOPIC-based invites (NOT /user/queue)
      const inviteTopic = `/topic/invites.${username}`;
      console.log("📻 Subscribing to invite topic:", inviteTopic);
      
      stompClient.subscribe(inviteTopic, (message) => {
        console.log("═══════════════════════════════════════");
        console.log("🎉🎉🎉 INVITE MESSAGE RECEIVED 🎉🎉🎉");
        console.log("Raw body:", message.body);
        console.log("═══════════════════════════════════════");
        
        try {
          const data = JSON.parse(message.body);
          console.log("Parsed data:", data);
          
          // Check if it's an acceptance notification
          if (data.type === "INVITE_ACCEPTED") {
            console.log("✅ Someone accepted your invite!");
            alert(`✅ ${data.text}`);
          } else {
            // It's a new invite
            console.log("📨 New collaboration invite!");
            if (onInviteReceived) {
              onInviteReceived(data);
            } else {
              console.error("⚠️ No invite handler registered!");
            }
          }
        } catch (err) {
          console.error("❌ Failed to parse invite message:", err);
        }
      });
      
      console.log("✅ Subscribed to:", inviteTopic);
      console.log("═══════════════════════════════════════");
    },

    onStompError: (frame) => {
      console.error("═══════════════════════════════════════");
      console.error("❌ STOMP ERROR");
      console.error("Message:", frame.headers["message"]);
      console.error("Body:", frame.body);
      console.error("═══════════════════════════════════════");
    },

    onWebSocketError: (error) => {
      console.error("❌ WebSocket error:", error);
    },
  });

  stompClient.activate();
};

const subscribeToRoom = (room) => {
  if (!stompClient || !stompClient.connected) {
    console.warn("⚠️ Cannot subscribe to room - not connected");
    return;
  }

  if (roomSubscription) {
    roomSubscription.unsubscribe();
    console.log("🔌 Unsubscribed from previous room");
  }

  console.log(`📻 Subscribing to room: /topic/room.${room}`);
  roomSubscription = stompClient.subscribe(`/topic/room.${room}`, (message) => {
    try {
      const payload = JSON.parse(message.body);
      console.log("📥 Room message:", payload.type, "from", payload.user);
      if (onMessageCallback) {
        onMessageCallback(payload);
      }
    } catch (err) {
      console.error("❌ Failed to parse room message:", err);
    }
  });

  currentRoom = room;
  console.log(`✅ Subscribed to room: ${room}`);
};

export const sendCodeUpdate = (codeMessage) => {
  if (!currentRoom) {
    console.warn("⚠️ No room selected");
    return;
  }
  
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/app/room.${currentRoom}`,
      body: JSON.stringify(codeMessage),
    });
  }
};

export const sendInvite = (fromUser, toUser) => {
  if (!stompClient || !stompClient.connected) {
    console.warn("⚠️ Cannot send invite - not connected");
    return;
  }

  console.log("═══════════════════════════════════════");
  console.log("📤 SENDING INVITE");
  console.log("From:", fromUser);
  console.log("To:", toUser);
  console.log("═══════════════════════════════════════");
  
  stompClient.publish({
    destination: "/app/invite",
    body: JSON.stringify({ fromUser, toUser }),
  });
  
  console.log("✅ Invite sent to backend");
};

export const acceptInvite = (fromUser, newRoom) => {
  if (!stompClient || !stompClient.connected) {
    console.warn("⚠️ Cannot accept invite - not connected");
    return null;
  }

  console.log("═══════════════════════════════════════");
  console.log("✅ ACCEPTING INVITE");
  console.log("From:", fromUser);
  console.log("Joining room:", newRoom);
  console.log("═══════════════════════════════════════");
  
  // Switch to inviter's room
  subscribeToRoom(newRoom);

  // Notify backend
  stompClient.publish({
    destination: "/app/accept-invite",
    body: JSON.stringify({ fromUser, toUser: username }),
  });

  console.log("✅ Joined room:", newRoom);
  return newRoom;
};

export const getCurrentRoom = () => currentRoom;
export const getCurrentUsername = () => username;

export const disconnectWebSocket = () => {
  if (stompClient && stompClient.active) {
    stompClient.deactivate();
    stompClient = null;
    roomSubscription = null;
    console.log("🔌 Disconnected");
  }
};

const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.username || payload.name || "anonymous";
  } catch (err) {
    console.error("❌ Failed to decode token:", err);
    return "anonymous";
  }
};

