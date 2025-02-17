# Collaborative Code Editor

A real-time collaborative code editor with AI-powered features, supporting multiple programming languages and simultaneous editing.

## Features

- Real-time collaborative editing
- AI-powered code suggestions
- Syntax highlighting for multiple languages
- Secure authentication system
- Code execution in sandboxed environment
- Version control capabilities

## Tech Stack

### Backend
- Spring Boot
- WebSocket/STOMP
- Redis
- PostgreSQL
- MongoDB
- Docker

### Frontend
- React.js
- Monaco Editor
- Redux/Context for state management
- WebSocket client

### AI Integration
- Python/Flask microservice
- OpenAI integration

### Infrastructure
- Docker
- Kubernetes
- AWS/Azure
- GitHub Actions

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- Docker
- Maven
- Git

### Local Development Setup
1. Clone the repository
```bash
git clone https://github.com/yourusername/collaborative-code-editor.git
cd collaborative-code-editor
```

2. Backend Setup
```bash
cd backend
mvn clean install
```

3. Frontend Setup
```bash
cd frontend
npm install
```

4. Run the application
```bash
# Start backend
cd backend
mvn spring-boot:run

# Start frontend (in a new terminal)
cd frontend
npm start
```
