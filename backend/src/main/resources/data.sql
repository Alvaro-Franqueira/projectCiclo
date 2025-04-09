-- Insertar admin
INSERT INTO usuarios (username, password, email, balance, fecha_registro, rol) 
VALUES ('admin', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'admin@casino.com', 5000.0, '2023-01-01 10:00:00', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Insertar jugadores
INSERT INTO usuarios (username, password, email, balance, fecha_registro, rol) 
VALUES 
('jugador1', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'jugador1@email.com', 1500.0, '2023-01-15 11:30:00', 'USER')
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (username, password, email, balance, fecha_registro, rol) 
VALUES 
('jugador2', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'jugador2@email.com', 750.0, '2023-02-01 09:15:00', 'USER')
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (username, password, email, balance, fecha_registro, rol) 
VALUES 
('jugador3', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'jugador3@email.com', 2000.0, '2023-02-10 16:45:00', 'USER')
ON CONFLICT (email) DO NOTHING;

-- Insertar juegos
INSERT INTO juegos (nombre, descripcion) 
VALUES 
('Roulette', 'Classic casino roulette game with numbers from 0 to 36. Bet on colors, numbers, or sections.')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO juegos (nombre, descripcion) 
VALUES 
('Dice', 'Roll the dice and bet on the outcome. Various betting options available.')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar apuesta
INSERT INTO apuesta (cantidad, fecha_apuesta, estado, winloss, tipo, valor_apostado, usuario_id, juego_id) 
VALUES 
(100.0, '2023-03-01 14:20:00', 'GANADA', 100.0, 'COLOR', 'red', 
 (SELECT id FROM usuarios WHERE username='jugador1'), 
 (SELECT id FROM juegos WHERE nombre='Roulette'))
ON CONFLICT (usuario_id, fecha_apuesta, cantidad) DO NOTHING;
