Este é o script SQL para criar a sua estrutura de banco de dados. Você deve executá-lo no seu SGBD (como o pgAdmin ou DBeaver) para criar as tabelas antes de iniciar o backend.


-- Remove tabelas existentes (para testes, se necessário)
DROP TABLE IF EXISTS likes, comments, posts, vaccines, services, pets, users CASCADE;

-- 1. Tabela de Usuários (baseado no array 'users')
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL, -- NUNCA armazene senhas em texto puro
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Pets (baseado no array 'pets')
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL, -- 'dog' ou 'cat'
    breed VARCHAR(100),
    age VARCHAR(50), -- 'puppy', 'young', 'adult', 'senior'
    size VARCHAR(50), -- 'small', 'medium', 'large'
    gender VARCHAR(50), -- 'male', 'female'
    type VARCHAR(50) NOT NULL, -- 'adoption' ou 'personal'
    status VARCHAR(50) NOT NULL, -- 'available', 'adopted', 'personal'
    description TEXT,
    photo_url VARCHAR(255), -- URL da imagem (para um futuro S3 ou upload)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Vacinas (baseado em 'pets.vaccines')
CREATE TABLE vaccines (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    next_date DATE,
    vet VARCHAR(150),
    notes TEXT
);

-- 4. Tabela de Serviços (baseado em 'serviceProviders')
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'vet', 'sitter', 'walker', 'transport'
    name VARCHAR(150) NOT NULL,
    professional VARCHAR(150),
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT,
    -- Campos de geolocalização (para API de Mapas - Unidade IV)
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Posts do Blog (baseado em 'blogPosts')
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(280) NOT NULL,
    photo_url VARCHAR(255),
    location VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Comentários (baseado em 'blogPosts.comments')
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Likes (baseado em 'blogPosts.likes')
-- Tabela de ligação Muitos-para-Muitos
CREATE TABLE likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id) -- Garante que um usuário só curta uma vez
);