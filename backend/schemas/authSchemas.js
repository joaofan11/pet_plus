<<<<<<< HEAD
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
    // Atualizado: Regex para senha forte (8 chars, Maiúscula, Minúscula, Número, Símbolo)
    password: Joi.string()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, um número e um símbolo.',
        'string.empty': 'A senha é obrigatória.',
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
=======
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
    // Atualizado: Regex para senha forte (8 chars, Maiúscula, Minúscula, Número, Símbolo)
    password: Joi.string()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, um número e um símbolo.',
        'string.empty': 'A senha é obrigatória.',
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
>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
};