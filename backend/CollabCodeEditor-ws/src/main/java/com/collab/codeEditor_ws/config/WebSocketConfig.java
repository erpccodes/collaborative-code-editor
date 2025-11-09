package com.collab.codeEditor_ws.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.collab.codeEditor_ws.model.StompPrincipal;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                StompCommand command = accessor.getCommand();

                if (StompCommand.CONNECT.equals(command)) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);

                        if (!isValidToken(token)) {
                            System.out.println("❌ Invalid token rejected");
                            throw new IllegalArgumentException("Invalid JWT Token");
                        }

                        String username = extractUsernameFromToken(token);
                        StompPrincipal principal = new StompPrincipal(username);
                        
                        accessor.setUser(principal);
                        
                        if (accessor.getSessionAttributes() != null) {
                            accessor.getSessionAttributes().put("username", username);
                        }

                        System.out.println("═══════════════════════════════════════");
                        System.out.println("🔑 WebSocket CONNECTED");
                        System.out.println("User: " + username);
                        System.out.println("Principal: " + principal.getName());
                        System.out.println("Session: " + accessor.getSessionId());
                        System.out.println("═══════════════════════════════════════");
                    } else {
                        System.out.println("❌ Missing Authorization header");
                        throw new IllegalArgumentException("Missing Authorization header");
                    }
                }
                
                if (StompCommand.SUBSCRIBE.equals(command)) {
                    String destination = accessor.getDestination();
                    // Get username from the stored accessor user
                    String username = accessor.getUser() != null ? accessor.getUser().getName() : "unknown";
                    System.out.println("📻 User '" + username + "' subscribed to: " + destination);
                }
                
                if (StompCommand.DISCONNECT.equals(command)) {
                    String username = accessor.getUser() != null ? accessor.getUser().getName() : "unknown";
                    System.out.println("═══════════════════════════════════════");
                    System.out.println("🔌 WebSocket DISCONNECTED");
                    System.out.println("User: " + username);
                    System.out.println("═══════════════════════════════════════");
                }

                return message;
            }
        });
    }
    
    private String extractUsernameFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                System.out.println("⚠️ Invalid token format");
                return "anonymous";
            }
            String payloadJson = new String(java.util.Base64.getDecoder().decode(parts[1]));
            if (payloadJson.contains("\"sub\"")) {
                int start = payloadJson.indexOf("\"sub\":\"") + 7;
                int end = payloadJson.indexOf("\"", start);
                String username = payloadJson.substring(start, end);
                System.out.println("✅ Extracted username from token: " + username);
                return username;
            }
            return "anonymous";
        } catch (Exception e) {
            System.out.println("❌ Error extracting username: " + e.getMessage());
            return "anonymous";
        }
    }

    private boolean isValidToken(String token) {
        return token != null && !token.isEmpty() && token.split("\\.").length == 3;
    }
}