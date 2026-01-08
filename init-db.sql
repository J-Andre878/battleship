
-- Tabla de jugadores
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT,
    avatar_url TEXT,
    level INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (google_id IS NOT NULL OR password_hash IS NOT NULL)
);

-- Tabla de partidas
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    player1_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    player2_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    winner_id INTEGER REFERENCES players(id),
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, playing, finished
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);

-- Tabla de tableros (posición de barcos)
CREATE TABLE ships (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    ship_type VARCHAR(20) NOT NULL, -- carrier, battleship, cruiser, submarine, destroyer
    positions JSONB NOT NULL, -- Array de coordenadas [{x:0, y:0}, {x:0, y:1}, ...]
    is_sunk BOOLEAN DEFAULT FALSE
);

-- Tabla de disparos
CREATE TABLE shots (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    hit BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_id, x, y)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_ships_game_player ON ships(game_id, player_id);
CREATE INDEX idx_shots_game ON shots(game_id);
