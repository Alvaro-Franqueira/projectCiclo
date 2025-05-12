# Casino Project

A full-stack casino application with React frontend and Spring Boot backend.

## Project Structure

- **frontend/**: React application built with Vite
- **backend/**: Spring Boot application with Java 17

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Java 17
- Maven
- PostgreSQL

## Getting Started

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd casino-project
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### Running the Application

You can run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Frontend only
npm run start:frontend

# Backend only
npm run start:backend
```

### Building for Production

```bash
npm run build
```

## Technologies Used

### Frontend
- React 19
- React Router
- Bootstrap/React Bootstrap
- Axios
- Various gaming libraries (React Roulette, Three.js, etc.)

### Backend
- Spring Boot 3.4
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT Authentication
- Stripe Payment Integration

## Project Structure Best Practices

- Keep reusable UI components in `frontend/src/components`
- Use context for global state management in `frontend/src/context`
- Services for API calls in `frontend/src/services`
- Backend follows standard Spring Boot architecture with controllers, services, repositories 