<<<<<<< HEAD
// backend/schemas/petsSchemas.js
const Joi = require('joi');

// Enumerações permitidas
const petSpecies = ['dog', 'cat'];
const petAge = ['puppy', 'young', 'adult', 'senior'];
const petSize = ['small', 'medium', 'large'];
const petGender = ['male', 'female'];
const petType = ['adoption', 'personal'];

// Schema para :petId nos parâmetros
const petIdSchema = Joi.object({
  params: Joi.object({
    petId: Joi.number().integer().min(1).required().messages({
      'number.base': 'O ID do Pet deve ser um número.',
      'any.required': 'O ID do Pet é obrigatório.',
    }),
  }),
  body: Joi.object(),
  query: Joi.object(),
});

// Schema para GET /adoption (query params)
const getAdoptionSchema = Joi.object({
  query: Joi.object({
    species: Joi.string().valid(...petSpecies).optional(),
    size: Joi.string().valid(...petSize).optional(),
    age: Joi.string().valid(...petAge).optional(),
    search: Joi.string().min(1).optional(),
  }),
  body: Joi.object(),
  params: Joi.object(),
});

// Schema para POST / (criar pet)
const createPetSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).required().messages({ 'any.required': 'O nome é obrigatório.' }),
    species: Joi.string().valid(...petSpecies).required().messages({ 'any.required': 'A espécie é obrigatória.' }),
    breed: Joi.string().min(2).required().messages({ 'any.required': 'A raça é obrigatória.' }),
    age: Joi.string().valid(...petAge).required().messages({ 'any.required': 'A idade é obrigatória.' }),
    size: Joi.string().valid(...petSize).required().messages({ 'any.required': 'O porte é obrigatório.' }),
    gender: Joi.string().valid(...petGender).required().messages({ 'any.required': 'O sexo é obrigatório.' }),
    type: Joi.string().valid(...petType).required().messages({ 'any.required': 'O tipo de cadastro é obrigatório.' }),
    description: Joi.string().min(10).required().messages({
      'any.required': 'A descrição é obrigatória.',
      'string.min': 'A descrição deve ter pelo menos 10 caracteres.',
    }),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

// Schema para PUT /:petId (atualizar pet)
const updatePetSchema = Joi.object({
  params: Joi.object({
    petId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Pet é obrigatório.' }),
  }),
  body: Joi.object({
    name: Joi.string().min(2).optional(),
    species: Joi.string().valid(...petSpecies).optional(),
    breed: Joi.string().min(2).optional(),
    age: Joi.string().valid(...petAge).optional(),
    size: Joi.string().valid(...petSize).optional(),
    gender: Joi.string().valid(...petGender).optional(),
    type: Joi.string().valid(...petType).optional(),
    description: Joi.string().min(10).optional(),
    // Importante: permite que o frontend envie a URL da foto antiga
    photoUrl: Joi.string().uri().allow(null, '').optional(), 
  }).min(1), // Pelo menos um campo deve ser enviado
  query: Joi.object(),
});

// Schema para POST /:petId/vaccines (adicionar vacina)
const addVaccineSchema = Joi.object({
  params: Joi.object({
    petId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Pet é obrigatório.' }),
  }),
  body: Joi.object({
    name: Joi.string().min(3).required().messages({ 'any.required': 'O nome da vacina é obrigatório.' }),
    date: Joi.date().iso().required().messages({ 'any.required': 'A data de aplicação é obrigatória.' }),
    nextDate: Joi.date().iso().allow(null).optional(),
    vet: Joi.string().allow(null, '').optional(),
    notes: Joi.string().allow(null, '').optional(),
  }),
  query: Joi.object(),
});

module.exports = {
  petIdSchema,
  getAdoptionSchema,
  createPetSchema,
  updatePetSchema,
  addVaccineSchema,
=======
// backend/schemas/petsSchemas.js
const Joi = require('joi');

// Enumerações permitidas
const petSpecies = ['dog', 'cat'];
const petAge = ['puppy', 'young', 'adult', 'senior'];
const petSize = ['small', 'medium', 'large'];
const petGender = ['male', 'female'];
const petType = ['adoption', 'personal'];

// Schema para :petId nos parâmetros
const petIdSchema = Joi.object({
  params: Joi.object({
    petId: Joi.number().integer().min(1).required().messages({
      'number.base': 'O ID do Pet deve ser um número.',
      'any.required': 'O ID do Pet é obrigatório.',
    }),
  }),
  body: Joi.object(),
  query: Joi.object(),
});

// Schema para GET /adoption (query params)
const getAdoptionSchema = Joi.object({
  query: Joi.object({
    species: Joi.string().valid(...petSpecies).optional(),
    size: Joi.string().valid(...petSize).optional(),
    age: Joi.string().valid(...petAge).optional(),
    search: Joi.string().min(1).optional(),
  }),
  body: Joi.object(),
  params: Joi.object(),
});

// Schema para POST / (criar pet)
const createPetSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).required().messages({ 'any.required': 'O nome é obrigatório.' }),
    species: Joi.string().valid(...petSpecies).required().messages({ 'any.required': 'A espécie é obrigatória.' }),
    breed: Joi.string().min(2).required().messages({ 'any.required': 'A raça é obrigatória.' }),
    age: Joi.string().valid(...petAge).required().messages({ 'any.required': 'A idade é obrigatória.' }),
    size: Joi.string().valid(...petSize).required().messages({ 'any.required': 'O porte é obrigatório.' }),
    gender: Joi.string().valid(...petGender).required().messages({ 'any.required': 'O sexo é obrigatório.' }),
    type: Joi.string().valid(...petType).required().messages({ 'any.required': 'O tipo de cadastro é obrigatório.' }),
    description: Joi.string().min(10).required().messages({
      'any.required': 'A descrição é obrigatória.',
      'string.min': 'A descrição deve ter pelo menos 10 caracteres.',
    }),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

// Schema para PUT /:petId (atualizar pet)
const updatePetSchema = Joi.object({
  params: Joi.object({
    petId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Pet é obrigatório.' }),
  }),
  body: Joi.object({
    name: Joi.string().min(2).optional(),
    species: Joi.string().valid(...petSpecies).optional(),
    breed: Joi.string().min(2).optional(),
    age: Joi.string().valid(...petAge).optional(),
    size: Joi.string().valid(...petSize).optional(),
    gender: Joi.string().valid(...petGender).optional(),
    type: Joi.string().valid(...petType).optional(),
    description: Joi.string().min(10).optional(),
    // Importante: permite que o frontend envie a URL da foto antiga
    photoUrl: Joi.string().uri().allow(null, '').optional(), 
  }).min(1), // Pelo menos um campo deve ser enviado
  query: Joi.object(),
});

// Schema para POST /:petId/vaccines (adicionar vacina)
const addVaccineSchema = Joi.object({
  params: Joi.object({
    petId: Joi.number().integer().min(1).required().messages({ 'any.required': 'O ID do Pet é obrigatório.' }),
  }),
  body: Joi.object({
    name: Joi.string().min(3).required().messages({ 'any.required': 'O nome da vacina é obrigatório.' }),
    date: Joi.date().iso().required().messages({ 'any.required': 'A data de aplicação é obrigatória.' }),
    nextDate: Joi.date().iso().allow(null).optional(),
    vet: Joi.string().allow(null, '').optional(),
    notes: Joi.string().allow(null, '').optional(),
  }),
  query: Joi.object(),
});

module.exports = {
  petIdSchema,
  getAdoptionSchema,
  createPetSchema,
  updatePetSchema,
  addVaccineSchema,
>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
};