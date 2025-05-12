-- Migration script to translate database column names from Spanish to English

-- Rename tables
ALTER TABLE IF EXISTS usuarios RENAME TO users;
ALTER TABLE IF EXISTS juegos RENAME TO games;
ALTER TABLE IF EXISTS apuesta RENAME TO bet;

-- Rename columns in users table
ALTER TABLE IF EXISTS users RENAME COLUMN fecha_registro TO registration_date;
ALTER TABLE IF EXISTS users RENAME COLUMN rol TO role;

-- Rename columns in bet table
ALTER TABLE IF EXISTS bet RENAME COLUMN cantidad TO amount;
ALTER TABLE IF EXISTS bet RENAME COLUMN tipo_apuesta TO bet_type;
ALTER TABLE IF EXISTS bet RENAME COLUMN valor_apostado TO bet_value;
ALTER TABLE IF EXISTS bet RENAME COLUMN valor_ganador TO winning_value;
ALTER TABLE IF EXISTS bet RENAME COLUMN fecha_apuesta TO bet_date;
ALTER TABLE IF EXISTS bet RENAME COLUMN estado TO status;
ALTER TABLE IF EXISTS bet RENAME COLUMN usuario_id TO user_id;
ALTER TABLE IF EXISTS bet RENAME COLUMN juego_id TO game_id;

-- Rename columns in games table
ALTER TABLE IF EXISTS games RENAME COLUMN nombre TO name;
ALTER TABLE IF EXISTS games RENAME COLUMN descripcion TO description;

-- Update foreign key constraints
ALTER TABLE IF EXISTS bet DROP CONSTRAINT IF EXISTS fk_bet_user;
ALTER TABLE IF EXISTS bet DROP CONSTRAINT IF EXISTS fk_bet_game;

ALTER TABLE IF EXISTS bet 
ADD CONSTRAINT fk_bet_user FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE IF EXISTS bet 
ADD CONSTRAINT fk_bet_game FOREIGN KEY (game_id) REFERENCES games(id);
