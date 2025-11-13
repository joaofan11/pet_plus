<<<<<<< HEAD
// backend/schemas/servicesSchemas.js
const Joi = require('joi');

// Enumerações permitidas
const serviceCategories = ['vet', 'sitter', 'walker', 'transport'];

// Schema para :serviceId nos parâmetros
const serviceIdSchema = Joi.object({
  params: Joi.object({
    serviceId: Joi.number().integer().min(1).required().messages({
      'number.base': 'O ID do Serviço deve ser um número.',
      'any.required': 'O ID do Serviço é obrigatório.',
    }),
  }),
  body: Joi.object(),
  query: Joi.object(),
});

// Schema para GET / (query params)
const getServicesSchema = Joi.object({
  query: Joi.object({
    category: Joi.string().valid(...serviceCategories).optional(),
    search: Joi.string().min(1).optional(),
  }),
  body: Joi.object(),
  params: Joi.object(),
});

// Schema para POST / (criar serviço)
const createServiceSchema = Joi.object({
  body: Joi.object({
    category: Joi.string().valid(...serviceCategories).required().messages({ 'any.required': 'A categoria é obrigatória.' }),
    name: Joi.string().min(3).required().messages({ 'any.required': 'O nome do serviço é obrigatório.' }),
    professional: Joi.string().min(3).required().messages({ 'any.required': 'O nome do profissional é obrigatório.' }),
    phone: Joi.string().min(8).required().messages({ 'any.required': 'O telefone é obrigatório.' }),
    address: Joi.string().min(5).required().messages({ 'any.required': 'O endereço é obrigatório.' }),
    description: Joi.string().min(10).required().messages({ 'any.required': 'A descrição é obrigatória.' }),
    latitude: Joi.number().allow(null).optional(),
    longitude: Joi.number().allow(null).optional(),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

// Schema para PUT /:serviceId (atualizar serviço)
const updateServiceSchema = Joi.object({
  params: Joi.object({
    serviceId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Serviço é obrigatório.' }),
  }),
  body: Joi.object({
    category: Joi.string().valid(...serviceCategories).optional(),
    name: Joi.string().min(3).optional(),
    professional: Joi.string().min(3).optional(),
    phone: Joi.string().min(8).optional(),
    address: Joi.string().min(5).optional(),
    description: Joi.string().min(10).optional(),
    latitude: Joi.number().allow(null).optional(),
    longitude: Joi.number().allow(null).optional(),
  }).min(1), // Pelo menos um campo deve ser enviado
  query: Joi.object(),
});

module.exports = {
  serviceIdSchema,
  getServicesSchema,
  createServiceSchema,
  updateServiceSchema,
=======
// backend/schemas/servicesSchemas.js
const Joi = require('joi');

// Enumerações permitidas
const serviceCategories = ['vet', 'sitter', 'walker', 'transport'];

// Schema para :serviceId nos parâmetros
const serviceIdSchema = Joi.object({
  params: Joi.object({
    serviceId: Joi.number().integer().min(1).required().messages({
      'number.base': 'O ID do Serviço deve ser um número.',
      'any.required': 'O ID do Serviço é obrigatório.',
    }),
  }),
  body: Joi.object(),
  query: Joi.object(),
});

// Schema para GET / (query params)
const getServicesSchema = Joi.object({
  query: Joi.object({
    category: Joi.string().valid(...serviceCategories).optional(),
    search: Joi.string().min(1).optional(),
  }),
  body: Joi.object(),
  params: Joi.object(),
});

// Schema para POST / (criar serviço)
const createServiceSchema = Joi.object({
  body: Joi.object({
    category: Joi.string().valid(...serviceCategories).required().messages({ 'any.required': 'A categoria é obrigatória.' }),
    name: Joi.string().min(3).required().messages({ 'any.required': 'O nome do serviço é obrigatório.' }),
    professional: Joi.string().min(3).required().messages({ 'any.required': 'O nome do profissional é obrigatório.' }),
    phone: Joi.string().min(8).required().messages({ 'any.required': 'O telefone é obrigatório.' }),
    address: Joi.string().min(5).required().messages({ 'any.required': 'O endereço é obrigatório.' }),
    description: Joi.string().min(10).required().messages({ 'any.required': 'A descrição é obrigatória.' }),
    latitude: Joi.number().allow(null).optional(),
    longitude: Joi.number().allow(null).optional(),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

// Schema para PUT /:serviceId (atualizar serviço)
const updateServiceSchema = Joi.object({
  params: Joi.object({
    serviceId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Serviço é obrigatório.' }),
  }),
  body: Joi.object({
    category: Joi.string().valid(...serviceCategories).optional(),
    name: Joi.string().min(3).optional(),
    professional: Joi.string().min(3).optional(),
    phone: Joi.string().min(8).optional(),
    address: Joi.string().min(5).optional(),
    description: Joi.string().min(10).optional(),
    latitude: Joi.number().allow(null).optional(),
    longitude: Joi.number().allow(null).optional(),
  }).min(1), // Pelo menos um campo deve ser enviado
  query: Joi.object(),
});

module.exports = {
  serviceIdSchema,
  getServicesSchema,
  createServiceSchema,
  updateServiceSchema,
>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
};