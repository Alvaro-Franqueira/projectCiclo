-- Create the games table if it doesn't exist
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY, -- Or BIGSERIAL, or however you define your ID in the Game entity
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
    -- Add any other columns your 'Game' entity has (e.g., min_bet, max_bet, etc.)
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,         -- Or BIGSERIAL
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Stores the hashed password
    role VARCHAR(50) NOT NULL,      -- e.g., 'USER', 'ADMIN'
    balance DECIMAL(19, 2) DEFAULT 0.00,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- any other columns
);

INSERT INTO users (username, email, password, role, balance, registration_date)
SELECT
    'admin',
    'adsfadsf@aasdf.co',
    '$2a$10$SwAhHi8PnTVr4llwyw1RF.EFGB.5jt9uLV4sd1Z8LYS/KxXhq5iKu', -- Hashed password from your example
    'ADMIN',
    24878.40,
    '2025-04-16 12:19:12.997221+00'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Insert Roulette if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Roulette', 'A classic casino game where players bet on where the ball will land on the spinning wheel.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Roulette');

-- Insert Dice if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Dice', 'An exciting game of chance and strategy involving bets on the outcome of dice rolls.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Dice');

-- Insert Filler Game Alpha if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Filler Game Alpha', 'A generic title designed to occupy a specific position in the database ID sequence.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Sports betting');

-- Insert Filler Game Beta if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Filler Game Beta', 'A temporary placeholder, essential for initial setup and the desired order of identifiers.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Sports betting');

-- Insert Filler Game Gamma if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Filler Game Gamma', 'Used to fill gaps in the games table, ensuring consistency in ID assignment.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Sports betting');

-- Insert Filler Game Delta if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Filler Game Delta', 'A structural element in the database, facilitating the establishment of controlled ID numbering.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Sports betting');

-- Insert Slot Machine if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Slot Machine', 'A vibrant and popular slot machine, where luck determines prizes with each spin of its reels.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Slot Machine');

-- Insert Filler Game Epsilon if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Filler Game Epsilon', 'Designed to complete the ID sequence, allowing for a specific organization of game records.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Sports betting');

-- Insert Blackjack if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Blackjack', 'A popular card game where players try to reach 21 points without going over, competing against the dealer.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Blackjack');

-- Insert Poker if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Poker', 'A strategic card game that combines skill, bluffing, and stake management to win the pot.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Poker');

-- Insert Sports betting if it doesn't exist
INSERT INTO games (name, description)
SELECT 'Sports betting', 'The practice of wagering money on the outcome of sporting events, offering dynamic odds and various betting modalities.'
WHERE NOT EXISTS (SELECT 1 FROM games WHERE name = 'Sports betting');

