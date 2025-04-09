-- Insert test bets for the dice game
-- Assuming the dice game has ID 2 and we're using the current user

-- Get the current user ID (this will need to be replaced with the actual user ID)
-- For testing, we'll use ID 1 (usually the admin user)
SET @user_id = 1;

-- Insert 10 test bets with different outcomes
INSERT INTO apuesta (cantidad, fecha_apuesta, estado, winloss, tipo, valor_apostado, usuario_id, juego_id) 
VALUES 
(50.0, NOW() - INTERVAL 1 HOUR, 'GANADA', 50.0, 'parimpar', 'par', @user_id, 2),
(25.0, NOW() - INTERVAL 2 HOUR, 'PERDIDA', -25.0, 'parimpar', 'impar', @user_id, 2),
(100.0, NOW() - INTERVAL 3 HOUR, 'GANADA', 100.0, 'numero', '7', @user_id, 2),
(75.0, NOW() - INTERVAL 4 HOUR, 'PERDIDA', -75.0, 'numero', '10', @user_id, 2),
(30.0, NOW() - INTERVAL 5 HOUR, 'GANADA', 30.0, 'parimpar', 'par', @user_id, 2),
(60.0, NOW() - INTERVAL 6 HOUR, 'PERDIDA', -60.0, 'parimpar', 'impar', @user_id, 2),
(45.0, NOW() - INTERVAL 7 HOUR, 'GANADA', 45.0, 'numero', '8', @user_id, 2),
(80.0, NOW() - INTERVAL 8 HOUR, 'PERDIDA', -80.0, 'numero', '11', @user_id, 2),
(20.0, NOW() - INTERVAL 9 HOUR, 'GANADA', 20.0, 'parimpar', 'par', @user_id, 2),
(90.0, NOW() - INTERVAL 10 HOUR, 'PERDIDA', -90.0, 'parimpar', 'impar', @user_id, 2);
