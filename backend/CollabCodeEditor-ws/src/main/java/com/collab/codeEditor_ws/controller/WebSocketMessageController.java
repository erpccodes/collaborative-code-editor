package com.collab.codeEditor_ws.controller;


import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.collab.codeEditor_ws.model.MessagePayload;
import com.collab.codeEditor_ws.service.CollaborationService;

@RestController
public class WebSocketMessageController {

    private final CollaborationService collaborationService;

    public WebSocketMessageController(CollaborationService collaborationService) {
        this.collaborationService = collaborationService;
    }

    // Client sends to /app/room.{room}
    @MessageMapping("/room.{room}")
    public void relay(@DestinationVariable String room,
                      @Payload MessagePayload message,
                      SimpMessageHeaderAccessor headers) {
        // optionally enrich with username from handshake attributes
        Object username = headers.getSessionAttributes() != null ? headers.getSessionAttributes().get("username") : null;
        if (username != null && (message.getUser() == null || message.getUser().isBlank())) {
            message.setUser(username.toString());
        }
        message.setRoom(room);
        collaborationService.broadcast(room, message);
    }
    
    @GetMapping("/latest")
    public MessagePayload getLatest() {
        return collaborationService.getLatestState();
    }
}
