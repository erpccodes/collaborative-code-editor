package com.collab.codeEditor_ws.service;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class RoomManager {
    // username -> roomId
    private final Map<String, String> userRooms = new HashMap<>();

    // roomId -> list of participants
    private final Map<String, Set<String>> roomParticipants = new HashMap<>();

    // pending invites: targetUser -> inviterUsername
    private final Map<String, String> pendingInvites = new HashMap<>();

    public void createRoom(String username) {
        String roomId = UUID.randomUUID().toString();
        userRooms.put(username, roomId);
        roomParticipants.put(roomId, new HashSet<>(List.of(username)));
    }

    public String getRoomOfUser(String username) {
        return userRooms.get(username);
    }

    public void inviteUser(String fromUser, String toUser) {
        pendingInvites.put(toUser, fromUser);
    }

    public Optional<String> acceptInvite(String username) {
        String inviter = pendingInvites.remove(username);
        if (inviter == null) return Optional.empty();

        String roomId = userRooms.get(inviter);
        roomParticipants.get(roomId).add(username);
        userRooms.put(username, roomId);
        return Optional.of(roomId);
    }

    public Set<String> getUsersInRoom(String roomId) {
        return roomParticipants.getOrDefault(roomId, Set.of());
    }
}