// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

// --- 1. Segurança Básica (Helmet) ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Permite que scripts inline ou de mesma origem sejam executados (importante para o frontend)
  contentSecurityPolicy: false, 
}));

// --- 2. Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20, // Aumentei levemente para evitar bloqueios durante testes
  message: 'Muitas tentativas de acesso. Tente novamente em uma hora.'
});
app.use('/api/auth', authLimiter);

// --- 3. CORS ---
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());


// Serve as imagens de upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve os arquivos do Frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../frontend')));

// --- 5. Rotas da API ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/services', require('./routes/services'));
app.use('/api/blog', require('./routes/blog'));

// Rota de saúde
app.get('/api', (req, res) => {
  res.send('API PetPlus V1.0 funcionando!');
});

// --- 6. Rota Catch-All (Para servir o index.html em qualquer outra rota) ---
// Isso garante que se o usuário acessar /login ou /register direto, o HTML é carregado
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Middleware de Erro (Sempre o último)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
