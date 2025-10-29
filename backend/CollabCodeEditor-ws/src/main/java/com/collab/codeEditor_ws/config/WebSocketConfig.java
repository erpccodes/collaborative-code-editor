package com.collab.codeEditor_ws.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.messaging.simp.config.ChannelRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // frontend connects to ws://localhost:8585/ws
        registry.addEndpoint("/ws/**")
                .setAllowedOriginPatterns("*"); 
    }

    @Override	
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // enable broker for topics
        registry.enableSimpleBroker("/topic");

        // all messages starting with /app will go to @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);

                        // TODO: replace with your real JWT validation
                        if (!isValidToken(token)) {
                            throw new IllegalArgumentException("Invalid JWT Token");
                        }

                        // optionally set authenticated user here
                        // accessor.setUser(new UsernamePasswordAuthenticationToken(user, null, authorities));
                    } else {
                        throw new IllegalArgumentException("Missing Authorization header");
                    }
                }

                return message;
            }
        });
    }

    // Dummy validator
    private boolean isValidToken(String token) {
        return token != null && !token.isEmpty();
    }
}
