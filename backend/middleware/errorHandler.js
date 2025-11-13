// backend/middleware/errorHandler.js
const { AppError } = require('../utils/errors');

// Lida com erros em ambiente de desenvolvimento (mostra stack trace)
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

// Lida com erros em ambiente de produção (oculta stack trace)
const sendErrorProd = (err, res) => {
  // Apenas envia detalhes de erros operacionais (que confiamos)
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    // 1. Loga o erro (para o time de dev)
    console.error('ERROR 💥:', err);
    // 2. Envia uma mensagem genérica (para o usuário)
    res.status(500).json({
      success: false,
      message: 'Algo deu errado! Por favor, tente novamente mais tarde.',
    });
  }
};

// Lida com erros de validação do Joi
const handleJoiError = (err) => {
    const message = err.details.map(detail => detail.message).join(', ');
    return new AppError(`Validação falhou: ${message}`, 400);
};

// Lida com erros de token JWT
const handleJWTError = () => new AppError('Token inválido. Por favor, faça login novamente.', 401);

module.exports = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500; // Default 500

  // Converte erros específicos em AppError operacional
  if (err.name === 'ValidationError') error = handleJoiError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTError(); // Trata como o mesmo

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};