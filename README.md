# Virtual Casino

A full-featured virtual casino application with multiple games, user authentication, and administration.

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

## Styling System

The application now uses a consistent styling approach based on the SlotMachine component's aesthetic. The implementation includes:

### Global Theme

- `CasinoTheme.css`: Contains global variables and baseline styles for the entire application
- Color palette based on casino themes with gold accents
- Standardized shadows, gradients, and font settings
- Reusable component styles for cards, buttons, and forms

### Game-Specific Styles

Each game has its own CSS file that extends the global theme:

- `Blackjack.css`: Specific styling for the Blackjack game
- `Roulette.css`: Custom styles for the Roulette game
- `DiceGame.css`: Unique styling for the Dice game
- `SlotMachine.css`: The base styling that informed the entire theme

### Authentication and Admin

- `Auth.css`: Consistent styling for login and registration components
- `UserManagement.css`: Admin panel styling for user and game management

## Components

- **Authentication**: Login and Registration
- **Games**: 
  - Slot Machine
  - Blackjack
  - Roulette
  - Dice Game
- **Admin Panel**: User and Game management
- **Payment Processing**: Credit purchasing

## Technology Stack

- React for the frontend
- Bootstrap framework with custom styling
- RESTful API integration 