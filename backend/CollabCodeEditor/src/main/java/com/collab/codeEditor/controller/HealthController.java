package com.collab.codeEditor.controller;

import java.util.Collections;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api")
@CrossOrigin(origins = "http://localhost:5173")
public class HealthController {

	@GetMapping("/health")
	public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("UP");
    }
	
	 @GetMapping("/hello")
	  public Map<String, String> sayHello() {
	    return Collections.singletonMap("message", "Hello from Spring Boot!");
	  }
}
