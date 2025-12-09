import React, { useEffect, useState, useRef } from "react";
import {
  connectWebSocket,
  sendCodeUpdate,
  sendInvite,
  acceptInvite,
  getCurrentRoom,
} from "../services/websocket";
import { jwtDecode } from "jwt-decode";
import Editor from "@monaco-editor/react";
import axios from "axios";

const CollaborativeEditor = () => {
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("anonymous");
  const [inviteUser, setInviteUser] = useState("");
  const [room, setRoom] = useState("");
  const [pendingInvite, setPendingInvite] = useState(null);
  const [collaborator, setCollaborator] = useState(null);
  const token = localStorage.getItem("token");
  const [language, setLanguage] = useState("java");
  const [output, setOutput] = useState("");
  const [outputError, setOutputError] = useState("");

  // Decode username from JWT
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const user = decoded.sub || decoded.username || "anonymous";
        setUsername(user);
        setRoom(`room-${user}`);
        console.log("👤 Logged in as:", user);
      } catch (err) {
        console.error("❌ Failed to decode JWT", err);
      }
    }
  }, [token]);

  // WebSocket connection + message handlers
  useEffect(() => {
    if (token && username !== "anonymous") {
      console.log("🔌 Initializing WebSocket connection for:", username);
      
      connectWebSocket(
        token,
        // Code update handler
        (msg) => {
          console.log("📥 Received message:", msg);
          
          if (msg.user === username && msg.type === "EDIT") {
            console.log("⏭️ Skipping own message");
            return;
          }
          
          if (msg.type === "EDIT") {
            console.log("✏️ Updating code from remote user:", msg.user);
            setCode(msg.text);
          } else if (msg.type === "JOIN") {
            setCollaborator(msg.user);
            alert(`✅ ${msg.user} joined the collaboration!`);
          }
        },
        // Invitation handler
        (invite) => {
          console.log("📨 🎉 INVITATION RECEIVED 🎉");
          console.log("Invite details:", invite);
          
          const from = invite.fromUser || invite.user;
          console.log(`From: ${from}, To: ${username}`);
          
          setPendingInvite(invite);
          alert(`🔔 NEW INVITE from ${from}! Check the page for details.`);
        }
      );
    }
  }, [token, username]);

  // Handle typing in the editor
  const handleChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);

    sendCodeUpdate({
      type: "EDIT",
      text: newCode,
      user: username,
      room: room,
    });
  };

  // Send invitation to another user
  const handleInvite = () => {
    if (!inviteUser.trim()) {
      alert("⚠️ Please enter a username to invite!");
      return;
    }
    
    if (inviteUser.trim() === username) {
      alert("⚠️ You cannot invite yourself!");
      return;
    }

    console.log(`📤 Sending invite from ${username} to ${inviteUser.trim()}`);
    sendInvite(username, inviteUser.trim());
    alert(`📨 Invitation sent to ${inviteUser}! Waiting for them to accept...`);
    setInviteUser("");
  };

  // handle code run button
  const handleRunCode = async () => {
  try {
    const response = await axios.post("http://localhost:8585/api/execute/java", {
      code
    });

    const { output: out, error } = response.data;

    if (error) {
      setOutputError(error);
      setOutput("");
    } else {
      setOutput(out);
      setOutputError("");
    }
  } catch (err) {
    console.error("Error executing code:", err);
    setOutputError("Execution failed: " + err.message);
    setOutput("");
  }
};


  // Accept an invite and join the shared room
  const handleAcceptInvite = (invite) => {
    const from = invite.fromUser || invite.user;
    const sharedRoom = `room-${from}`;
    
    console.log(`✅ Accepting invite from ${from}`);
    console.log(`🔄 Switching from ${room} to ${sharedRoom}`);
    
    const newRoom = acceptInvite(from, sharedRoom);
    if (newRoom) {
      setRoom(newRoom);
      setCollaborator(from);
      setPendingInvite(null);
      alert(`✅ Joined collaboration with ${from}! You can now edit together.`);
    }
  };

  // Decline invite
  const handleDeclineInvite = () => {
    const from = pendingInvite?.fromUser || pendingInvite?.user;
    setPendingInvite(null);
    alert(`❌ Invitation from ${from} declined`);
  };

  return (
    <>
      <style>{`
  * {
    box-sizing: border-box;
  }

  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    background-color: #f8f9fa !important;
    overflow: hidden;
  }

  /* Ensure the main editor fills the entire screen */
  .editor-layout {
    position: fixed;          /* Full viewport coverage */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: #f8f9fa;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  /* Sidebar */
  .sidebar {
    width: 350px;
    min-width: 350px;
    height: 100%;
    overflow-y: auto;
    background-color: #ffffff;
    border-right: 1px solid #e0e0e0;
    padding: 30px 20px;
  }

  /* Right-side code editor */
  .editor-pane {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    background-color: #f8f9fa;
    height: 100%;
  }

  @keyframes pulse {
    0%, 100% { 
      transform: scale(1); 
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
    }
    50% { 
      transform: scale(1.02); 
      box-shadow: 0 6px 20px rgba(255, 193, 7, 0.6);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transition: all 0.3s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .btn-success {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    transition: all 0.3s ease;
  }

  .btn-success:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(17, 153, 142, 0.4);
  }

  .btn-danger {
    background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    transition: all 0.3s ease;
  }

  .btn-danger:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(235, 51, 73, 0.4);
  }
`}</style>
    
<div
  style={{
    position: "fixed",      // break out of parent constraints
    inset: 0,               // top:0 right:0 bottom:0 left:0
    display: "flex",
    alignItems: "stretch",
    backgroundColor: "#f8f9fa",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    overflow: "hidden"      // prevent double scrollbars
  }}
>

      
      {/* LEFT SIDEBAR - Fixed width */}
      <div style={{
        width: "350px",
        minWidth: "350px",
        padding: "30px 20px",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e0e0e0",
        overflowY: "auto",
        height: "100vh",
        position: "sticky",
        top: 0
      }}>
        <h1 style={{ 
          textAlign: "center", 
          color: "#2c3e50",
          fontSize: "28px",
          marginBottom: "10px",
          fontWeight: "700"
        }}>
          🚀 Collaborative Editor
        </h1>
        <p style={{
          textAlign: "center",
          color: "#7f8c8d",
          fontSize: "14px",
          marginBottom: "30px"
        }}>
          Real-time collaboration
        </p>
        
        {/* User Info Panel */}
        <div style={{ 
          marginBottom: "25px", 
          padding: "20px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "12px",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ 
            marginTop: "0",
            marginBottom: "15px",
            color: "#2c3e50",
            fontSize: "18px",
            fontWeight: "600"
          }}>
            👤 User Info
          </h3>
          <p style={{ margin: "8px 0", fontSize: "14px", color: "#2c3e50" }}>
            <span style={{ fontWeight: "600" }}>User:</span> <span style={{ color: "#667eea", fontWeight: "700" }}>{username}</span>
          </p>
          <p style={{ margin: "8px 0", fontSize: "14px", color: "#2c3e50" }}>
            <span style={{ fontWeight: "600" }}>Room:</span> <span style={{ color: "#667eea", fontWeight: "700", fontSize: "12px" }}>{room}</span>
          </p>
          {collaborator && (
            <p style={{ margin: "8px 0", fontSize: "14px", color: "#2c3e50" }}>
              <span style={{ fontWeight: "600" }}>Collaborating with:</span> <span style={{ color: "#11998e", fontWeight: "700" }}>{collaborator}</span>
            </p>
          )}
          <div style={{ 
            marginTop: "12px",
            padding: "8px 16px", 
            backgroundColor: room.includes(username) ? "#e3f2fd" : "#e8f5e9",
            borderRadius: "6px",
            fontWeight: "600",
            color: room.includes(username) ? "#1565c0" : "#2e7d32",
            fontSize: "13px",
            textAlign: "center"
          }}>
            {room.includes(username) ? "🔒 Personal Room" : "👥 Shared Room"}
          </div>
        </div>

        {/* PENDING INVITE NOTIFICATION */}
        {pendingInvite && (
          <div style={{
            marginBottom: "25px",
            padding: "20px",
            backgroundColor: "#fff8e1",
            borderRadius: "12px",
            border: "3px solid #ffd54f",
            boxShadow: "0 4px 12px rgba(255, 193, 7, 0.3)",
            animation: "pulse 2s infinite, slideIn 0.5s ease",
          }}>
            <h3 style={{ 
              margin: "0 0 10px 0", 
              color: "#f57f17",
              fontSize: "20px",
              fontWeight: "700"
            }}>
              🔔 New Invite!
            </h3>
            <p style={{ 
              fontSize: "15px", 
              margin: "10px 0", 
              fontWeight: "600",
              color: "#424242"
            }}>
              <strong style={{ color: "#f57f17" }}>{pendingInvite.fromUser || pendingInvite.user}</strong> wants to collaborate!
            </p>
            <p style={{ 
              fontSize: "13px", 
              color: "#616161", 
              margin: "10px 0",
              lineHeight: "1.5"
            }}>
              Accept to join their room and edit together.
            </p>
            <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => handleAcceptInvite(pendingInvite)}
                className="btn-success"
                style={{
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(17, 153, 142, 0.3)",
                  width: "100%"
                }}
              >
                ✅ Accept
              </button>
              <button
                onClick={handleDeclineInvite}
                className="btn-danger"
                style={{
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(235, 51, 73, 0.3)",
                  width: "100%"
                }}
              >
                ❌ Decline
              </button>
            </div>
          </div>
        )}

        {/* Invite Section */}
        <div style={{ 
          marginBottom: "25px", 
          padding: "20px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "12px",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ 
            marginTop: "0", 
            marginBottom: "15px",
            color: "#2c3e50",
            fontSize: "18px",
            fontWeight: "600"
          }}>
            📨 Invite Collaborator
          </h3>
          <input
            type="text"
            placeholder="Enter username"
            value={inviteUser}
            onChange={(e) => setInviteUser(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleInvite()}
            style={{
              padding: "12px 14px",
              width: "100%",
              borderRadius: "8px",
              border: "2px solid #e0e0e0",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.3s ease",
              color: "#2c3e50",
              backgroundColor: "#ffffff",
              marginBottom: "10px"
            }}
            onFocus={(e) => e.target.style.borderColor = "#667eea"}
            onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
          />
          <button
            onClick={handleInvite}
            className="btn-primary"
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
              width: "100%"
            }}
          >
            📤 Send Invite
          </button>
          <p style={{ 
            fontSize: "12px", 
            color: "#7f8c8d", 
            marginTop: "10px", 
            marginBottom: "0",
            lineHeight: "1.5"
          }}>
            💡 User must be logged in
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - CODE EDITOR - 2/3 width */}
      <div style={{
  flex: 1,
  padding: "30px",
  backgroundColor: "#f8f9fa",
  overflowY: "auto",
  height: "100vh"
}}>
        <div style={{ 
          backgroundColor: "#1e1e1e",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          height: "calc(100vh - 60px)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
            paddingBottom: "15px",
            borderBottom: "2px solid #333"
          }}>
            <h3 style={{ 
              margin: "0",
              color: "#d4d4d4",
              fontSize: "20px",
              fontWeight: "600"
            }}>
              💻 Code Editor
            </h3>
            {collaborator && (
              <span style={{ 
                color: "#11998e",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "#2a2a2a",
                padding: "6px 12px",
                borderRadius: "6px"
              }}>
                👥 Editing with {collaborator}
              </span>
            )}
          </div>
             <select
        onChange={(e) => setLanguage(e.target.value)}
        value={language}
        style={{
          marginBottom: "10px",
          padding: "8px",
          borderRadius: "6px",
          fontSize: "14px",
        }}
      >
        <option value="java">Java</option>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
        <option value="c">C</option>
      </select>

      
  <button
  onClick={handleRunCode}
  className="btn-primary"
  style={{
    marginTop: "10px",
    padding: "10px 20px",
    borderRadius: "8px",
    color: "white",
    border: "none",
    cursor: "pointer"
  }}
>
  ▶️ Run Code
</button>

      <Editor
        height="calc(100vh - 150px)"
        width="100%"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(newCode) => handleChange({ target: { value: newCode } })}
        onMount={(editor) => {
          editor.onDidFocusEditorText(() => {
            editor.updateOptions({ renderLineHighlight: "all" });
          });
          editor.onDidBlurEditorText(() => {
            editor.updateOptions({ renderLineHighlight: "none" });
          });
        }}
        options={{
          fontSize: 15,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />

        <div
  style={{
    marginTop: "20px",
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #333",
    height: "200px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    fontFamily: "'Fira Code', monospace"
  }}
>
  <h3 style={{ margin: "0 0 10px 0", color: "#4caf50" }}>🖥 Output</h3>

  {output && (
    <div style={{ color: "#9cdcfe" }}>
      {output}
    </div>
  )}

  {outputError && (
    <div style={{ color: "#ff6b6b" }}>
      {outputError}
    </div>
  )}

  {!output && !outputError && (
    <div style={{ color: "#666" }}>Run code to see output here...</div>
  )}
</div>


        </div>
      </div>
    </div>
    </>
  );
};

export default CollaborativeEditor;