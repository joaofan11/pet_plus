-- Tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pets
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age VARCHAR(50),
    size VARCHAR(50),
    gender VARCHAR(50),
    pet_type VARCHAR(50) NOT NULL, -- 'adoption' ou 'personal'
    status VARCHAR(50) NOT NULL, -- 'available', 'adopted', 'personal'
    description TEXT,
    photo_path VARCHAR(255), -- Caminho para a foto salva no servidor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Vacinas
CREATE TABLE vaccines (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    vaccine_date DATE NOT NULL,
    next_date DATE,
    vet VARCHAR(255),
    notes TEXT
);