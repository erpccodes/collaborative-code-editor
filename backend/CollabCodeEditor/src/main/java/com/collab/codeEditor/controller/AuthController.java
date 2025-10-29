package com.collab.codeEditor.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.collab.codeEditor.dto.JwtResponse;
import com.collab.codeEditor.dto.LoginRequest;
import com.collab.codeEditor.dto.SignupRequest;
import com.collab.codeEditor.entity.User;
import com.collab.codeEditor.security.UserDetailsImpl;
import com.collab.codeEditor.security.jwt.JwtUtils;
import com.collab.codeEditor.service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	   @Autowired
	    AuthenticationManager authenticationManager;

	    @Autowired
	    UserService userService;

	    @Autowired
	    JwtUtils jwtUtils;

	    @PostMapping("/signin")
	    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
	        Authentication authentication = authenticationManager.authenticate(
	                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

	        SecurityContextHolder.getContext().setAuthentication(authentication);
	        String jwt = jwtUtils.generateJwtToken(loginRequest.getUsername());

	        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

	        return ResponseEntity.ok(new JwtResponse(jwt,
	        		"Bearer",
	                userDetails.getId(),
	                userDetails.getUsername(),
	                userDetails.getEmail(),
	                userDetails.getAuthorities().stream().map(item -> item.getAuthority()).toList()));
	    }

	    @PostMapping("/signup")
	    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
	        try {
	            User user = userService.registerUser(signUpRequest);
	            return ResponseEntity.ok("User registered successfully!");
	        } catch (Exception e) {
	            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
	        }
	    }
}
