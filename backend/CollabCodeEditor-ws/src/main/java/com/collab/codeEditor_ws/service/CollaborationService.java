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
    
    // Store the latest message for each room in memory
    private final ConcurrentMap<String, MessagePayload> latestMessages = new ConcurrentHashMap<>();
    
    public CollaborationService(SimpMessagingTemplate messagingTemplate, RoomManager roomManager) {
        this.messagingTemplate = messagingTemplate;
        this.roomManager = roomManager;
    }
    
    // Broadcast a message to all connected clients in that room
    public void broadcast(String room, MessagePayload payload) {
        // Store the latest message for this room
        if (payload.getType().equals("EDIT")) {
            latestMessages.put(room, payload);
        }
        
        // Broadcast to all subscribers of this room
        messagingTemplate.convertAndSend("/topic/room." + room, payload);
        
        System.out.println("📡 Broadcast to /topic/room." + room + " from user: " + payload.getUser() + " (Type: " + payload.getType() + ")");
    }
    
    public void acceptInvite(String username, String inviter) {
        System.out.println("🔄 Processing invite acceptance...");
        System.out.println("   User accepting: " + username);
        System.out.println("   Inviter: " + inviter);
        
        roomManager.acceptInvite(username, inviter).ifPresent(room -> {
            System.out.println("   Joined room: " + room);
            
            // Notify all users in the room that someone joined
            MessagePayload joinMessage = new MessagePayload(
                "JOIN",
                username + " joined the collaboration.",
                username,
                room
            );
            
            messagingTemplate.convertAndSend("/topic/room." + room, joinMessage);
            System.out.println("📢 Sent JOIN notification to room: " + room);
            
            // Send the latest code state to the new joiner
            MessagePayload latestState = latestMessages.get(room);
            if (latestState != null) {
                messagingTemplate.convertAndSendToUser(
                    username,
                    "/queue/initial-state",
                    latestState
                );
                System.out.println("📤 Sent initial code state to " + username);
            } else {
                System.out.println("ℹ️ No existing code state in room " + room);
            }
        });
    }
    
    // Return the latest known message for a room
    public MessagePayload getLatestState() {
        return latestMessages.getOrDefault(
            "collaboration",
            new MessagePayload("SYSTEM", "", "system", "collaboration")
        );
    }
    
    // Get latest state for a specific room
    public MessagePayload getLatestStateForRoom(String room) {
        return latestMessages.getOrDefault(
            room,
            new MessagePayload("SYSTEM", "", "system", room)
        );
    }
}