package com.collab.codeEditor_ws.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.collab.codeEditor_ws.model.MessagePayload;

@Service
public class CollaborationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomManager roomManager;

    // 🧠 Store the latest message for each room in memory
    private final ConcurrentMap<String, MessagePayload> latestMessages = new ConcurrentHashMap<>();

    public CollaborationService(SimpMessagingTemplate messagingTemplate,RoomManager roomManager) {
        this.messagingTemplate = messagingTemplate;
        this.roomManager = roomManager;
    }

    // 🔊 Broadcast a message to all connected clients in that room
    public void broadcast(String username, Object payload) {
        String room = roomManager.getRoomOfUser(username);
        if (room == null) {
            // If user has no room, create one for them
            roomManager.createRoom(username);
            room = roomManager.getRoomOfUser(username);
        }

        messagingTemplate.convertAndSend("/topic/room." + room, payload);
    }
    
    public void sendInvite(String fromUser, String toUser) {
        roomManager.inviteUser(fromUser, toUser);
        messagingTemplate.convertAndSend(
            "/topic/invite." + toUser,
            new MessagePayload(
                "INVITE",                                 // type
                fromUser + " invited you to collaborate.", // text
                fromUser,                                 // user (sender)
                null                                      // room (not joined yet)
            )
        );
    }

    
    public void acceptInvite(String username) {
        roomManager.acceptInvite(username).ifPresent(room -> {
            messagingTemplate.convertAndSend(
                "/topic/room." + room,
                new MessagePayload(
                    "JOIN",                                // type
                    username + " joined the collaboration.", // text
                    username,                               // user
                    room                                    // room
                )
            );
        });
    }

    // ✅ Return the latest known message for a room
    public MessagePayload getLatestState() {
        // You can change "collaboration" to your desired default room
        return latestMessages.getOrDefault(
            "collaboration",
            new MessagePayload("SYSTEM", "", "system", "collaboration")
        );
    }
}
