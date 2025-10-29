import React, { useEffect, useState } from "react";
import {
  connectWebSocket,
  sendCodeUpdate,
  sendInvite,
  acceptInvite,
} from "../services/websocket";
import { jwtDecode } from "jwt-decode";

const Editor = () => {
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("anonymous");
  const [inviteUser, setInviteUser] = useState(""); // 👈 input field for sending invites
  const [room, setRoom] = useState("collaboration");
  const token = localStorage.getItem("token");

  // 🧩 Step 0: Decode username from JWT
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.sub || decoded.username || "anonymous");
      } catch (err) {
        console.error("❌ Failed to decode JWT", err);
      }
    }
  }, [token]);

  // 1️⃣ Fetch latest code from backend
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch("http://localhost:8585/latest", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCode(data.text || "");
        }
      } catch (err) {
        console.error("❌ Failed to fetch latest code", err);
      }
    };

    if (token) fetchLatest();
  }, [token]);

  // 2️⃣ WebSocket connection + message handlers
  useEffect(() => {
    if (token) {
      connectWebSocket(
        token,
        // 🔹 Code updates
        (msg) => {
          if (msg.type === "EDIT") {
            setCode(msg.text);
          }
        },
        // 🔹 Invitation handler
        (invite) => {
          const from = invite.user || invite.fromUser;
          if (
            window.confirm(
              `💌 ${from} invited you to collaborate. Accept invitation?`
            )
          ) {
            const newRoom = "shared-room-" + from;
            setRoom(newRoom);
            acceptInvite(newRoom);
          }
        }
      );
    }
  }, [token]);

  // 3️⃣ Handle typing
  const handleChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);

    sendCodeUpdate({
      type: "EDIT",
      text: newCode,
      user: username,
      room,
    });
  };

  // 4️⃣ Send invitation
  const handleInvite = () => {
    if (!inviteUser.trim()) {
      alert("Please enter a username to invite!");
      return;
    }
    sendInvite(username, inviteUser.trim());
    alert(`📨 Invitation sent to ${inviteUser}`);
    setInviteUser("");
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Collaborative Editor</h2>
      <p>
        👤 Logged in as: <strong>{username}</strong>
      </p>
      <p>
        🏠 Current Room: <strong>{room}</strong>
      </p>

      {/* 🔹 Invite Section */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter username to invite"
          value={inviteUser}
          onChange={(e) => setInviteUser(e.target.value)}
          style={{
            padding: "8px",
            width: "250px",
            marginRight: "10px",
            borderRadius: "5px",
          }}
        />
        <button
          onClick={handleInvite}
          style={{
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Invite
        </button>
      </div>

      {/* 🔹 Code Editor */}
      <textarea
        style={{
          width: "800px",
          height: "600px",
          borderRadius: "10px",
          padding: "10px",
          fontFamily: "monospace",
        }}
        value={code}
        onChange={handleChange}
      />
    </div>
  );
};

export default Editor;
