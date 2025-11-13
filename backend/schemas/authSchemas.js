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
    authId: Joi.string().required().messages({
      'string.empty': 'O ID de autenticação é obrigatório.',
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
        photoUrl: Joi.string().optional().allow(null, '')
    }).min(1), 
    query: Joi.object(),
    params: Joi.object(),
});

module.exports = {
  registerSchema,
  updateProfileSchema
};
