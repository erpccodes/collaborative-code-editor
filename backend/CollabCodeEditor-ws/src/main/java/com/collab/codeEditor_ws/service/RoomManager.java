package com.collab.codeEditor_ws.service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class RoomManager {
    
    // username -> roomId
    private final Map<String, String> userRooms = new ConcurrentHashMap<>();
    
    // roomId -> list of participants
    private final Map<String, Set<String>> roomParticipants = new ConcurrentHashMap<>();
    
    // pending invites: targetUser -> inviterUsername
    private final Map<String, String> pendingInvites = new ConcurrentHashMap<>();
    
    // Create a new room for a user with a specific room ID pattern
    public String createRoom(String username) {
        // Use username-based room naming for consistency
        String roomId = "room-" + username;
        
        // Check if room already exists for this user
        if (userRooms.containsKey(username)) {
            return userRooms.get(username);
        }
        
        userRooms.put(username, roomId);
        roomParticipants.put(roomId, ConcurrentHashMap.newKeySet());
        roomParticipants.get(roomId).add(username);
        
        System.out.println("🏠 Created room " + roomId + " for user " + username);
        return roomId;
    }
    
    // Get the room ID of a user
    public String getRoomOfUser(String username) {
        return userRooms.get(username);
    }
    
    // Send an invite from one user to another
    public void inviteUser(String fromUser, String toUser) {
        pendingInvites.put(toUser, fromUser);
        System.out.println("📨 Invite stored: " + fromUser + " -> " + toUser);
    }
    
    // Accept an invite and join the inviter's room
    public Optional<String> acceptInvite(String username, String inviter) {
        String storedInviter = pendingInvites.remove(username);
        
        // Verify the invite is from the expected user
        if (storedInviter == null || !storedInviter.equals(inviter)) {
            System.out.println("⚠️ No valid invite found for " + username + " from " + inviter);
            return Optional.empty();
        }
        
        // Get the inviter's room
        String roomId = userRooms.get(inviter);
        
        // If inviter doesn't have a room, create one
        if (roomId == null) {
            roomId = createRoom(inviter);
        }
        
        // Remove user from their old room if they have one
        String oldRoom = userRooms.get(username);
        if (oldRoom != null && roomParticipants.containsKey(oldRoom)) {
            roomParticipants.get(oldRoom).remove(username);
            System.out.println("🚪 " + username + " left old room: " + oldRoom);
        }
        
        // Add the accepting user to the inviter's room
        roomParticipants.get(roomId).add(username);
        userRooms.put(username, roomId);
        
        System.out.println("✅ " + username + " joined " + inviter + "'s room: " + roomId);
        System.out.println("👥 Room " + roomId + " participants: " + roomParticipants.get(roomId));
        
        return Optional.of(roomId);
    }
    
    // Get all users in a specific room
    public Set<String> getUsersInRoom(String roomId) {
        return roomParticipants.getOrDefault(roomId, Collections.emptySet());
    }
    
    // Remove a user from their current room
    public void removeUserFromRoom(String username) {
        String roomId = userRooms.remove(username);
        if (roomId != null && roomParticipants.containsKey(roomId)) {
            roomParticipants.get(roomId).remove(username);
            System.out.println("🚪 " + username + " left room " + roomId);
            
            // Clean up empty rooms
            if (roomParticipants.get(roomId).isEmpty()) {
                roomParticipants.remove(roomId);
                System.out.println("🗑️ Removed empty room: " + roomId);
            }
        }
    }
    
    // Check if two users are in the same room
    public boolean areUsersInSameRoom(String user1, String user2) {
        String room1 = userRooms.get(user1);
        String room2 = userRooms.get(user2);
        return room1 != null && room1.equals(room2);
    }
}