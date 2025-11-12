// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler'); // <-- IMPORTAR

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
const corsOptions = {
  origin: process.env.FRONTEND_URL, // Apenas permite o seu frontend
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json()); // Parser para JSON

// Isso faz com que a URL http://localhost:3001/uploads/nome-da-imagem.png funcione
// Se estiver usando Supabase para *todos* os uploads, esta linha não é estritamente necessária.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/services', require('./routes/services'));
app.use('/api/blog', require('./routes/blog'));

// Rota de "saúde" da API
app.get('/api', (req, res) => {
  res.send('API PetPlus V1.0 funcionando!');
});

// ******************************************************
// ** MIDDLEWARE GLOBAL DE TRATAMENTO DE ERROS **
// ** Deve ser o ÚLTIMO middleware a ser adicionado **
app.use(errorHandler);
// ******************************************************

// Iniciar servidor
app.listen(port, () => {
  console.log(`=====================Servidor rodando em http://localhost:${port}========================== Bem Vindo Ao Petplus`);
});