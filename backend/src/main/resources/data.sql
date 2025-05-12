--DROP TABLE IF EXISTS bet CASCADE;
--DROP TABLE IF EXISTS games CASCADE;
--DROP TABLE IF EXISTS users CASCADE;

--delete table games;
--Insert only Roulette and Dice into games
 --INSERT INTO games (name, description) VALUES
--('Roulette', 'Classic roulette game with numbers from 0 to 36'),
 --('Dice', 'Betting game involving dice rolls') 
 --ON CONFLICT (name) DO NOTHING; 


-- Insert only Roulette and Dice into games
--INSERT INTO games (name, description) VALUES
--('Roulette', 'Classic roulette game with numbers from 0 to 36'),
--('Dice', 'Betting game involving dice rolls')
--ON CONFLICT (name) DO NOTHING;
-- Insert data into users (reduced to 3 users)
--INSERT INTO users (username, password, email, balance, registration_date, role) VALUES
--('player1', '$2a$10$xJwL5v5z3J6f5ZJ7Q8bB0eKZ9vY6wX0yR2sA3bC4d5E6f7G8h9i0j', 'player1@example.com', 1500.00, '2023-01-15 10:30:00', 'USER'),
--('player2', '$2a$10$yKvL6w4z5J7f6Z8Q9cC1dL0vX1yR2sA3bC4d5E6f7G8h9i0j1k2l', 'player2@example.com', 2500.50, '2023-02-20 14:45:00', 'USER'),
--('admin', 'password', 'admin@casino.com', 10000.00, '2023-01-01 09:00:00', 'ADMIN')
--ON CONFLICT (email) DO NOTHING;
-- Insert bets only for Roulette and Dice
--INSERT INTO bet (amount, bet_type, bet_value, winning_value, bet_date, status, winloss, user_id, game_id) VALUES
-- Bets on Roulette (game_id = 1)
--(100.00, 'color', 'red', 'red', '2023-05-01 12:30:00', 'won', 100.00, 1, 1),
--(50.00, 'evenodd', 'even', 'odd', '2023-05-01 13:45:00', 'lost', -50.00, 1, 1),
--(75.00, 'number', '17', '17', '2023-05-02 16:10:00', 'won', 2625.00, 2, 1),
--(60.00, 'evenodd', 'odd', 'odd', '2023-05-06 11:40:00', 'won', 60.00, 2, 1),

-- Bets on Dice (game_id = 2)
--(120.00, 'number', '7', '7', '2023-05-05 20:15:00', 'won', 4200.00, 1, 2),
--(80.00, 'number', '12', '7', '2023-05-04 14:25:00', 'lost', -80.00, 3, 2),
--(90.00, 'half', 'high', 'low', '2023-05-06 13:50:00', 'lost', -90.00, 2, 2)
--ON CONFLICT (user_id, bet_date, amount) DO NOTHING;

