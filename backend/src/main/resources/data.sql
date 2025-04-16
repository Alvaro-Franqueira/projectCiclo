--DROP TABLE IF EXISTS apuesta CASCADE;
--DROP TABLE IF EXISTS juegos CASCADE;
--DROP TABLE IF EXISTS usuarios CASCADE;

--delete table juegos;
--nsert only Roulette and Dice into games
 --INSERT INTO juegos (name, description) VALUES
--('Roulette', 'Classic roulette game with numbers from 0 to 36'),
 --('Dice', 'Betting game involving dice rolls') 
 --ON CONFLICT (name) DO NOTHING; 


-- Insertar solo Ruleta y Dados en juegos
--INSERT INTO juegos (nombre, descripcion) VALUES
--('Ruleta', 'Juego clásico de ruleta con números del 0 al 36'),
--('Dados', 'Juego de apuestas con lanzamiento de dados')
--ON CONFLICT (nombre) DO NOTHING;
-- Insertar datos en usuarios (reducido a 3 usuarios)
--INSERT INTO usuarios (username, password, email, balance, fecha_registro, rol) VALUES
--('jugador1', '$2a$10$xJwL5v5z3J6f5ZJ7Q8bB0eKZ9vY6wX0yR2sA3bC4d5E6f7G8h9i0j', 'jugador1@example.com', 1500.00, '2023-01-15 10:30:00', 'USER'),
--('jugador2', '$2a$10$yKvL6w4z5J7f6Z8Q9cC1dL0vX1yR2sA3bC4d5E6f7G8h9i0j1k2l', 'jugador2@example.com', 2500.50, '2023-02-20 14:45:00', 'USER'),
--('admin', 'password', 'admin@casino.com', 10000.00, '2023-01-01 09:00:00', 'ADMIN')
--ON CONFLICT (email) DO NOTHING;
-- Insertar apuestas solo para Ruleta y Dados
--INSERT INTO apuesta (cantidad, tipo_apuesta, valor_apostado, valor_ganador, fecha_apuesta, estado, winloss, usuario_id, juego_id) VALUES
-- Apuestas en Ruleta (juego_id = 1)
--(100.00, 'color', 'rojo', 'rojo', '2023-05-01 12:30:00', 'ganada', 100.00, 1, 1),
--(50.00, 'par/impar', 'par', 'impar', '2023-05-01 13:45:00', 'perdida', -50.00, 1, 1),
--(75.00, 'número', '17', '17', '2023-05-02 16:10:00', 'ganada', 2625.00, 2, 1),
--(60.00, 'par/impar', 'impar', 'impar', '2023-05-06 11:40:00', 'ganada', 60.00, 2, 1),

-- Apuestas en Dados (juego_id = 2)
--(120.00, 'numero', '7', '7', '2023-05-05 20:15:00', 'ganada', 4200.00, 1, 2),
--(80.00, 'numero', '12', '7', '2023-05-04 14:25:00', 'perdida', -80.00, 3, 2),
--(90.00, 'mitad', 'mayor', 'menor', '2023-05-06 13:50:00', 'perdida', -90.00, 2, 2)
--ON CONFLICT (usuario_id, fecha_apuesta, cantidad) DO NOTHING;

