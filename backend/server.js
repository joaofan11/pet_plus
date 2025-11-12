require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3001;


const corsOptions = {
  
  origin: process.env.FRONTEND_URL,
  credentials: true, // Permite que o frontend envie cookies
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser()); // Habilita o parser de cookies

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limita cada IP a 10 requisições (login, register, refresh) por janela
  message: 'Muitas tentativas de autenticação deste IP, tente novamente após 15 minutos'
});

// Rotas da API
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/services', require('./routes/services'));
app.use('/api/blog', require('./routes/blog'));

// Rota de "saúde" da API
app.get('/api', (req, res) => {
  res.send('API PetPlus V1.0 funcionando!');
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`=====================Servidor rodando em http://localhost:${port}========================== Bem Vindo Ao Petplus
    `);
});
