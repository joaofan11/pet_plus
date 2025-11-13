<<<<<<< HEAD
// backend/schemas/blogSchemas.js
const Joi = require('joi');

// Schema para :postId nos parâmetros
const postIdSchema = Joi.object({
  params: Joi.object({
    postId: Joi.number().integer().min(1).required().messages({
      'number.base': 'O ID do Post deve ser um número.',
      'any.required': 'O ID do Post é obrigatório.',
    }),
  }),
  body: Joi.object(),
  query: Joi.object(),
});

// Schema para POST / (criar post)
const createPostSchema = Joi.object({
  body: Joi.object({
    content: Joi.string().min(1).max(280).required().messages({
      'string.empty': 'O conteúdo do post não pode estar vazio.',
      'string.max': 'O post não pode exceder 280 caracteres.',
    }),
    location: Joi.string().allow(null, '').optional(),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

// Schema para PUT /:postId (atualizar post)
const updatePostSchema = Joi.object({
  params: Joi.object({
    postId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Post é obrigatório.' }),
  }),
  body: Joi.object({
    content: Joi.string().min(1).max(280).optional(),
    location: Joi.string().allow(null, '').optional(),
    // Permite que o frontend envie a URL da foto antiga
    photoUrl: Joi.string().uri().allow(null, '').optional(),
  }).min(1), // Pelo menos um campo deve ser enviado
  query: Joi.object(),
});

// Schema para POST /:postId/comment (adicionar comentário)
const createCommentSchema = Joi.object({
  params: Joi.object({
    postId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Post é obrigatório.' }),
  }),
  body: Joi.object({
    content: Joi.string().min(1).required().messages({
      'string.empty': 'O comentário não pode estar vazio.',
    }),
  }),
  query: Joi.object(),
});

module.exports = {
  postIdSchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
=======
// backend/schemas/blogSchemas.js
const Joi = require('joi');

// Schema para :postId nos parâmetros
const postIdSchema = Joi.object({
  params: Joi.object({
    postId: Joi.number().integer().min(1).required().messages({
      'number.base': 'O ID do Post deve ser um número.',
      'any.required': 'O ID do Post é obrigatório.',
    }),
  }),
  body: Joi.object(),
  query: Joi.object(),
});

// Schema para POST / (criar post)
const createPostSchema = Joi.object({
  body: Joi.object({
    content: Joi.string().min(1).max(280).required().messages({
      'string.empty': 'O conteúdo do post não pode estar vazio.',
      'string.max': 'O post não pode exceder 280 caracteres.',
    }),
    location: Joi.string().allow(null, '').optional(),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

// Schema para PUT /:postId (atualizar post)
const updatePostSchema = Joi.object({
  params: Joi.object({
    postId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Post é obrigatório.' }),
  }),
  body: Joi.object({
    content: Joi.string().min(1).max(280).optional(),
    location: Joi.string().allow(null, '').optional(),
    // Permite que o frontend envie a URL da foto antiga
    photoUrl: Joi.string().uri().allow(null, '').optional(),
  }).min(1), // Pelo menos um campo deve ser enviado
  query: Joi.object(),
});

// Schema para POST /:postId/comment (adicionar comentário)
const createCommentSchema = Joi.object({
  params: Joi.object({
    postId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Post é obrigatório.' }),
  }),
  body: Joi.object({
    content: Joi.string().min(1).required().messages({
      'string.empty': 'O comentário não pode estar vazio.',
    }),
  }),
  query: Joi.object(),
});

module.exports = {
  postIdSchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
};