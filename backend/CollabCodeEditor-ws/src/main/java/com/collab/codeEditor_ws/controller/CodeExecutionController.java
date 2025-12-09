package com.collab.codeEditor_ws.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.*;
import java.nio.file.*;
import java.util.concurrent.*;

@RestController
@RequestMapping("/api/execute")
public class CodeExecutionController {

    @PostMapping("/java")
    public ResponseEntity<?> executeJava(@RequestBody CodeRequest request) {
        String code = request.getCode();
        String className = "Main"; // Expected class name for simplicity

        // 1️⃣ Create temp directory
        Path tempDir;
        try {
            tempDir = Files.createTempDirectory("javaexec_");
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to create temp dir");
        }

        Path javaFile = tempDir.resolve(className + ".java");
        Path classFile = tempDir.resolve(className + ".class");

        try {
            // 2️⃣ Write code to file
            Files.writeString(javaFile, code);

            // 3️⃣ Compile using javac
            ProcessBuilder compileBuilder = new ProcessBuilder("javac", javaFile.toAbsolutePath().toString());
            compileBuilder.directory(tempDir.toFile());
            Process compileProcess = compileBuilder.start();

            boolean compileSuccess = compileProcess.waitFor(3, TimeUnit.SECONDS);

            if (!compileSuccess || compileProcess.exitValue() != 0) {
                String error = new String(compileProcess.getErrorStream().readAllBytes());
                return ResponseEntity.ok(new ExecutionResult(null, "Compilation Error:\n" + error));
            }

            // 4️⃣ Run compiled class
            ProcessBuilder runBuilder = new ProcessBuilder("java", "-cp", tempDir.toString(), className);
            runBuilder.directory(tempDir.toFile());
            Process runProcess = runBuilder.start();

            boolean finished = runProcess.waitFor(3, TimeUnit.SECONDS);

            String output = new String(runProcess.getInputStream().readAllBytes());
            String error = new String(runProcess.getErrorStream().readAllBytes());

            if (!finished) {
                runProcess.destroyForcibly();
                return ResponseEntity.ok(new ExecutionResult(null, "Execution Timeout!"));
            }

            return ResponseEntity.ok(new ExecutionResult(output, error.isEmpty() ? null : error));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        } finally {
            // Optional cleanup
            try { Files.walk(tempDir).sorted((a,b)->b.compareTo(a)).forEach(p -> p.toFile().delete()); } catch (Exception ignored) {}
        }
    }

    // ✅ Inner classes
    public static class CodeRequest {
        private String code;
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }

    public static class ExecutionResult {
        private String output;
        private String error;
        public ExecutionResult(String output, String error) {
            this.output = output;
            this.error = error;
        }
        public String getOutput() { return output; }
        public String getError() { return error; }
    }
}