package com.collab.codeEditor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.collab.codeEditor.entity")
@EnableJpaRepositories(basePackages = "com.collab.codeEditor.repository")
public class CollabCodeEditorApplication {

	public static void main(String[] args) {
		SpringApplication.run(CollabCodeEditorApplication.class, args);
	}

}
