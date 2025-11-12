// backend/schemas/authSchemas.js
const Joi = require('joi');

const registerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).required().messages({
      'string.empty': 'O nome é obrigatório.',
      'string.min': 'O nome precisa ter pelo menos 3 caracteres.',
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'O email é obrigatório.',
      'string.email': 'Por favor, insira um email válido.',
    }),
    phone: Joi.string().required().messages({
      'string.empty': 'O telefone é obrigatório.',
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'A senha é obrigatória.',
      'string.min': 'A senha precisa ter pelo menos 6 caracteres.',
    }),
    // Garante que 'confirmPassword' seja igual a 'password'
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'As senhas não coincidem.',
      'string.empty': 'A confirmação da senha é obrigatória.',
    }),
  }),
  // Ignora 'query' e 'params'
  query: Joi.object(),
  params: Joi.object(),
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.empty': 'O email é obrigatório.',
      'string.email': 'Por favor, insira um email válido.',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'A senha é obrigatória.',
    }),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

const updateProfileSchema = Joi.object({
    body: Joi.object({
        name: Joi.string().min(3).optional(),
        email: Joi.string().email().optional(),
        phone: Joi.string().optional(),
    }).min(1), // Pelo menos um campo deve ser enviado
    query: Joi.object(),
    params: Joi.object(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema
};