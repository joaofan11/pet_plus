<<<<<<< HEAD
// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); // Adicionado: Cabeçalhos de segurança
const rateLimit = require('express-rate-limit'); // Adicionado: Rate limiting
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

// --- 1. Segurança Básica (Helmet) ---
// crossOriginResourcePolicy: "cross-origin" permite que o frontend carregue imagens deste backend
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// --- 2. Rate Limiting (Proteção contra DDoS/Brute Force) ---
// Limitador geral da API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', apiLimiter);

// Limitador estrito para Autenticação (Login/Register)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Limite de 10 tentativas de login/cadastro falhas
  message: 'Muitas tentativas de acesso. Tente novamente em uma hora.'
});
app.use('/api/auth', authLimiter);

// --- 3. CORS (Já implementado corretamente) ---
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Em produção, defina a URL exata do frontend
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Servir arquivos estáticos (imagens)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/services', require('./routes/services'));
app.use('/api/blog', require('./routes/blog'));

// Rota de saúde
app.get('/api', (req, res) => {
  res.send('API PetPlus V1.0 funcionando e segura!');
});

// Middleware de Erro (Sempre o último)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
=======
// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); // Adicionado: Cabeçalhos de segurança
const rateLimit = require('express-rate-limit'); // Adicionado: Rate limiting
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

// --- 1. Segurança Básica (Helmet) ---
// crossOriginResourcePolicy: "cross-origin" permite que o frontend carregue imagens deste backend
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// --- 2. Rate Limiting (Proteção contra DDoS/Brute Force) ---
// Limitador geral da API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', apiLimiter);

// Limitador estrito para Autenticação (Login/Register)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Limite de 10 tentativas de login/cadastro falhas
  message: 'Muitas tentativas de acesso. Tente novamente em uma hora.'
});
app.use('/api/auth', authLimiter);

// --- 3. CORS (Já implementado corretamente) ---
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Em produção, defina a URL exata do frontend
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Servir arquivos estáticos (imagens)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/services', require('./routes/services'));
app.use('/api/blog', require('./routes/blog'));

// Rota de saúde
app.get('/api', (req, res) => {
  res.send('API PetPlus V1.0 funcionando e segura!');
});

// Middleware de Erro (Sempre o último)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
});