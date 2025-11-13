<<<<<<< HEAD
// backend/middleware/validateRequest.js
const { BadRequestError } = require('../utils/errors');

/**
 * Middleware que valida a requisição contra um schema Joi.
 * @param {object} schema - O schema Joi com chaves opcionais 'body', 'query', 'params'.
 */
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(
    {
      body: req.body,
      query: req.query,
      params: req.params,
    },
    { abortEarly: false } // Mostra todos os erros de validação, não só o primeiro
  );

  if (error) {
    const validationErrors = error.details.map(detail => detail.message).join(', ');
    // Passa o erro para o errorHandler global
    return next(new BadRequestError(`Validação falhou: ${validationErrors}`));
  }
  
  next();
};

=======
// backend/middleware/validateRequest.js
const { BadRequestError } = require('../utils/errors');

/**
 * Middleware que valida a requisição contra um schema Joi.
 * @param {object} schema - O schema Joi com chaves opcionais 'body', 'query', 'params'.
 */
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(
    {
      body: req.body,
      query: req.query,
      params: req.params,
    },
    { abortEarly: false } // Mostra todos os erros de validação, não só o primeiro
  );

  if (error) {
    const validationErrors = error.details.map(detail => detail.message).join(', ');
    // Passa o erro para o errorHandler global
    return next(new BadRequestError(`Validação falhou: ${validationErrors}`));
  }
  
  next();
};

>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
module.exports = validateRequest;