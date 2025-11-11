PetPlus – Plataforma Web de Gestão e Adoção de Animais de Estimação

O PetPlus é um projeto acadêmico desenvolvido como parte das atividades da disciplina de Desenvolvimento Web.
Seu objetivo é demonstrar, de forma prática, o uso integrado de tecnologias web, bancos de dados relacionais e APIs RESTful, aplicadas a um contexto socialmente relevante: o cuidado, o acompanhamento de saúde e a adoção responsável de animais de estimação.

O sistema foi construído como uma aplicação full-stack, utilizando Node.js/Express no backend e JavaScript puro (Vanilla) no frontend, com PostgreSQL como sistema de gerenciamento de banco de dados.

Objetivos do Projeto:

Aplicar os princípios de desenvolvimento cliente-servidor e comunicação via API RESTful.
Implementar CRUDs completos para múltiplas entidades.
Garantir autenticação segura com JWT e hash de senhas.
Gerenciar upload de arquivos (fotos de perfis, pets e postagens).
Utilizar banco de dados relacional com chaves estrangeiras e integridade referencial.
Integrar APIs de geolocalização e mapas.
Desenvolver um frontend responsivo e funcional sem uso de frameworks.

Principais Funcionalidades:

Autenticação de usuários (registro, login, atualização de perfil e upload de foto).
Listagem e filtro de animais disponíveis para adoção.
Gestão de pets pessoais e carteira de vacinação digital.
Cadastro e exibição de serviços voltados a pets.
Blog comunitário com postagens, curtidas e comentários.
Geolocalização e exibição de serviços em mapa interativo.

Tecnológias:

Backend:
Node.js + Express.js
PostgreSQL (driver pg)
JSON Web Token (JWT)
bcryptjs (criptografia)
Multer (upload de imagens)
dotenv (variáveis de ambiente)
cors

Frontend:
HTML5
CSS3
JavaScript (Vanilla)
APIs Externas
Leaflet.js (mapas interativos)
OpenStreetMap (geocodificação reversa)

Procedimento de Instalação e Execução

1. Clonar o repositório
git clone [URL_DO_REPOSITORIO]
cd [DIRETORIO_DO_PROJETO]/backend

2. Instalar dependências
- npm install

3. Configurar variáveis de ambiente (.env)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
JWT_SECRET="chave_secreta"
PORT=3001

4. Criar as tabelas no PostgreSQL

O script abaixo define todas as tabelas utilizadas no projeto, com chaves primárias, estrangeiras e regras de integridade referencial adequadas.

DROP TABLE IF EXISTS likes, comments, posts, vaccines, services, pets, users CASCADE;

-- 1. Tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL, -- NUNCA armazene senhas em texto puro
    created_at TIMESTAMPTZ DEFAULT NOW(),
    photo_url VARCHAR(255)
);

-- 2. Tabela de Pets
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age VARCHAR(50),
    size VARCHAR(50),
    gender VARCHAR(50),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    photo_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Vacinas
CREATE TABLE vaccines (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    next_date DATE,
    vet VARCHAR(150),
    notes TEXT
);

-- 4. Tabela de Serviços
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    professional VARCHAR(150),
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Postagens (Blog)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(280) NOT NULL,
    photo_url VARCHAR(255),
    location VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Comentários
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Likes
CREATE TABLE likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

5. Executar o servidor
-npm run dev

6. Abrir o frontend

Abra o arquivo index.html na raiz do projeto em um navegador.
O frontend se comunica com http://localhost:3001/api.

Estrutura das Rotas da API

Autenticação (/api/auth)
POST /register
POST /login
PUT /me
Pets (/api/pets)
GET /adoption
GET /mypets
POST /
PUT /:petId
DELETE /:petId
PUT /:petId/adopt
POST /:petId/vaccines
Serviços (/api/services)
GET /
POST /
PUT /:serviceId
DELETE /:serviceId
Blog (/api/blog)
GET /
POST /
PUT /:postId
DELETE /:postId
POST /:postId/like
POST /:postId/comment

Resultados e Conclusões

O desenvolvimento do PetPlus permitiu a consolidação prática dos seguintes conhecimentos:
Estruturação e integração de um sistema full-stack.
Modelagem e manipulação de dados em bancos relacionais.
Implementação de autenticação segura com JWT.
Consumo e integração de APIs externas de mapas e geolocalização.
Aplicação de boas práticas de segurança e arquitetura RESTful.

Além do valor técnico, o projeto demonstra o potencial de soluções tecnológicas para promover adoção responsável e organização de cuidados com animais domésticos.
