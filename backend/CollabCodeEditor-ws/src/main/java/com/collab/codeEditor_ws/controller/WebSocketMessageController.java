package com.collab.codeEditor_ws.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.collab.codeEditor_ws.model.InvitePayload;
import com.collab.codeEditor_ws.model.MessagePayload;
import com.collab.codeEditor_ws.service.CollaborationService;

@RestController
public class WebSocketMessageController {
    
    private final CollaborationService collaborationService;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketMessageController(CollaborationService collaborationService,
                                     SimpMessagingTemplate messagingTemplate) {
        this.collaborationService = collaborationService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/room.{room}")
    public void relay(@DestinationVariable String room,
                      @Payload MessagePayload message,
                      SimpMessageHeaderAccessor headers) {
        
        Principal principal = headers.getUser();
        String username = principal != null ? principal.getName() : null;
        
        if (username == null && headers.getSessionAttributes() != null) {
            Object usernameObj = headers.getSessionAttributes().get("username");
            username = usernameObj != null ? usernameObj.toString() : null;
        }

        if (username != null && (message.getUser() == null || message.getUser().isBlank())) {
            message.setUser(username);
        }
        
        if (message.getRoom() == null || message.getRoom().isBlank()) {
            message.setRoom(room);
        }
        
        System.out.println("📨 Message from " + message.getUser() + " in " + room);
        collaborationService.broadcast(room, message);
    }
    
    @GetMapping("/latest")
    public MessagePayload getLatest() {
        return collaborationService.getLatestState();
    }
    
    @MessageMapping("/invite")
    public void sendInvite(@Payload InvitePayload invite, SimpMessageHeaderAccessor headers) {
        Principal principal = headers.getUser();
        String fromUser = principal != null ? principal.getName() : invite.getFromUser();
        
        System.out.println("═══════════════════════════════════════");
        System.out.println("📨 INVITE REQUEST");
        System.out.println("From: " + fromUser);
        System.out.println("To: " + invite.getToUser());
        
        invite.setFromUser(fromUser);
        
        // Use topic-based destination for reliability
        String destination = "/topic/invites." + invite.getToUser();
        System.out.println("📤 Sending to: " + destination);
        
        try {
            messagingTemplate.convertAndSend(destination, invite);
            System.out.println("✅ Invite sent successfully!");
        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("═══════════════════════════════════════");
    }
    
    @MessageMapping("/accept-invite")
    public void acceptInvite(@Payload InvitePayload invite, SimpMessageHeaderAccessor headers) {
        Principal principal = headers.getUser();
        String username = principal != null ? principal.getName() : invite.getToUser();
        
        System.out.println("═══════════════════════════════════════");
        System.out.println("✅ INVITE ACCEPTED");
        System.out.println("User: " + username);
        System.out.println("From: " + invite.getFromUser());
        System.out.println("═══════════════════════════════════════");
        
        collaborationService.acceptInvite(username, invite.getFromUser());
        
        // Notify inviter
        messagingTemplate.convertAndSend(
            "/topic/invites." + invite.getFromUser(),
            new MessagePayload(
                "INVITE_ACCEPTED", 
                username + " accepted your invitation", 
                username, 
                null
            )
        );
    }
}