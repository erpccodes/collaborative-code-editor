package com.collab.codeEditor_ws.security;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                // 👇 WebSocket handshake must be open
                .requestMatchers("/ws/**").permitAll()
                // allow also the SockJS fallback endpoints if you keep them
                //.requestMatchers("/ws/**/**").permitAll()
                .requestMatchers("/latest").permitAll()
                .anyRequest().permitAll()
            )
            // stateless sessions (important for WebSockets)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // disable login forms & http basic
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(form -> form.disable());

        return http.build();
    }
}
