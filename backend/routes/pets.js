// backend/routes/pets.js

// Módulos Nativos/Terceiros
const router = require('express').Router();

// Módulos Locais (Middleware)
const checkAuth = require('../middleware/checkAuth');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../config/multer'); // Importa a config centralizada

// Módulos Locais (Controllers e Schemas)
const petsController = require('../controllers/petsController');
const schemas = require('../schemas/petsSchemas');

// --- Rotas de Pets ---

// GET /api/pets/adoption (Público)
router.get(
  '/adoption',
  validateRequest(schemas.getAdoptionSchema),
  petsController.getAllAdoption
);

// GET /api/pets/mypets (Privado)
router.get(
  '/mypets',
  checkAuth,
  petsController.getMyPets
);

// POST /api/pets (Privado)
router.post(
  '/',
  checkAuth,
  upload.single('photo'), // Usa a instância centralizada
  validateRequest(schemas.createPetSchema),
  petsController.createPet
);

// PUT /api/pets/:petId (Privado)
router.put(
  '/:petId',
  checkAuth,
  upload.single('photo'), // Usa a instância centralizada
  validateRequest(schemas.updatePetSchema),
  petsController.updatePet
);

// DELETE /api/pets/:petId (Privado)
router.delete(
  '/:petId',
  checkAuth,
  validateRequest(schemas.petIdSchema),
  petsController.deletePet
);

// PUT /api/pets/:petId/adopt (Privado)
router.put(
  '/:petId/adopt',
  checkAuth,
  validateRequest(schemas.petIdSchema),
  petsController.markAsAdopted
);

// POST /api/pets/:petId/vaccines (Privado)
router.post(
  '/:petId/vaccines',
  checkAuth,
  validateRequest(schemas.addVaccineSchema),
  petsController.addVaccine
);

module.exports = router;