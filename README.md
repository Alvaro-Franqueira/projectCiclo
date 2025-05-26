# Virtual Casino

A full-featured virtual casino application with multiple games, user authentication, payment processing, and administration.

## Project Structure

- **frontend/**: React application built with Vite
  - `src/components/`: UI components, organized by domain (games, admin, auth, layout, etc.)
    - `games/`: Slot Machine, Blackjack, Roulette, Dice Game (each as a component)
    - `admin/`: User management and admin panel
    - `auth/`: Login, registration, and protected route components
    - `layout/`: Shared layout components (e.g., Navbar)
    - `profile/`, `ranking/`, `payment/`, `images/`: Profile, leaderboard, payment, and image components
  - `src/pages/`: Main pages (GameSelection, UserProfile, PaymentPage, etc.)
  - `src/services/`: API service modules for games, users, ranking, auth, payment, etc.
  - `src/context/`: Context providers for global state (e.g., AuthContext)
  - `src/assets/`: Images and styles
    - `styles/`: Global and game-specific CSS (Theme.css, SlotMachine.css, etc.)
  - `src/utils/`: Utility functions and helpers

- **backend/**: Spring Boot application with Java 17
  - `src/main/java/udaw/casino/`
    - `controller/`: REST controllers (User, Game, Bet, Payment, Ranking, Dice, Roulette)
    - `service/`: Business logic for games, users, bets, payments, rankings
    - `model/`: Entities (User, Game, Bet, Role, RankingType)
    - `repository/`: Spring Data JPA repositories
    - `security/`: JWT authentication, filters, user details
    - `config/`: Security, Stripe, and web configuration
    - `dto/`, `exception/`, `validation/`: Data transfer objects, error handling, validation

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Java 17
- Maven
- PostgreSQL

## Getting Started

I deployed the project in:
https://casino-frontend-theta.vercel.app/

It has the database in Supabase, the backend in Render and the frontend in Vercel. I removed the payment part because it's not ready for production



### Installation


FIRST OPTION

1. Install podman create and run the postgres container
podman run -d --name casinodb -p 5432:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin123 -e POSTGRES_DB=casinodb docker.io/library/postgres:15



2. Clone the repository
```bash
git clone https://github.com/Alvaro-Franqueira/projectCiclo.git
cd projectCiclo
```

3. Install dependencies
```bash
# Install root dependencies
npm install --legacy-peer-deps

# Install frontend dependencies
cd frontend
npm install --legacy-peer-deps
```

### Running the Application

You can run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

#### Run the Frontend Only

Open a terminal in the project root and run:
```bash
npm run start:frontend
```
This will start the React app (Vite) on http://localhost:5173/ by default.

or 

```bash
npm run dev
```

#### Run the Backend Only

Open a terminal in the project root and run:
```bash
npm run start:backend
```
This will start the Spring Boot backend (Maven) on http://localhost:8080/ by default.
 
or

Start the Springboot service with visual code  



### Building for Production

```bash
npm run build
```



SECOND OPTION 

1. Install Podman

2. Clone the repository
```bash
git clone https://github.com/Alvaro-Franqueira/projectCiclo.git
cd projectCiclo
```

3. Checkout podman branch

```bash
git checkout podman
```

now you have 3 containers running all 3 services

## Technologies Used

### Frontend
- React 19
- React Router
- Bootstrap/React Bootstrap
- Axios
- Vite

### Backend
- Spring Boot 3.4
- Spring Security (JWT-based)
- Spring Data JPA
- PostgreSQL
- Stripe Payment Integration

## Main Features

- **Authentication**: Login, registration, JWT-based session management
- **Games**: Slot Machine, Blackjack, Roulette, Dice Game (all with custom logic and UI)
- **Admin Panel**: User and game management
- **Payment Processing**: Stripe integration for credit purchasing
- **Ranking & Leaderboards**: Real-time ranking calculation and display
- **User Profile**: Bet history, game stats, balance chart

## Backend API Overview

- `/api/users`: User registration, login, profile
- `/api/games`: Game listing and details
- `/api/bets`: Place and retrieve bets
- `/api/payments`: Payment processing (Stripe)
- `/api/ranking`: Leaderboard and ranking calculation
- `/api/roulette`, `/api/dice`: Game-specific endpoints

## Styling System

The application uses a consistent styling approach based on the SlotMachine component's aesthetic:

### Global Theme

- `Theme.css`: Global variables and baseline styles for the entire application
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

## Components Overview

- **Authentication**: Login, Register, ProtectedRoute
- **Games**: Slot Machine, Blackjack, Roulette, Dice Game (modular components)
- **Admin Panel**: UserManagement
- **Payment**: CheckoutForm, StripeContainer
- **Profile**: ProfileHeader, BetHistory, GameStats, BalanceChart
- **Ranking**: RankingList
- **Layout**: Navbar

## Technology Stack

- React (frontend)
- Bootstrap (with custom styling)
- Spring Boot (backend)
- PostgreSQL (database)
- Stripe (payments)
- RESTful API 