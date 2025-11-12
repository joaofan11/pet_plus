// backend/routes/pets.js
const router = require('express').Router();
const petsController = require('../controllers/petsController');
const checkAuth = require('../middleware/checkAuth');
const validateRequest = require('../middleware/validateRequest');
const schemas = require('../schemas/petsSchemas');

// --- Configuração do Multer (Upload de Imagem) ---
// Mudamos para memoryStorage para integração com Supabase (via service)
const multer = require('multer');
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    // Rejeita o arquivo de forma que o errorHandler capture
    cb(new Error('Formato de imagem não suportado (apenas JPG, PNG, WebP)'), false);
  }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
});
// --- Fim da Configuração do Multer ---


// --- Rotas de Pets ---

// GET /api/pets/adoption (Público)
// Valida os query params (ex: ?species=dog)
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
// Aplica auth, upload, e validação do body
router.post(
  '/',
  checkAuth,
  upload.single('photo'),
  validateRequest(schemas.createPetSchema),
  petsController.createPet
);

// PUT /api/pets/:petId (Privado)
// Valida os params (petId) e o body
router.put(
  '/:petId',
  checkAuth,
  upload.single('photo'),
  validateRequest(schemas.updatePetSchema),
  petsController.updatePet
);

// DELETE /api/pets/:petId (Privado)
// Valida os params (petId)
router.delete(
  '/:petId',
  checkAuth,
  validateRequest(schemas.petIdSchema),
  petsController.deletePet
);

// PUT /api/pets/:petId/adopt (Privado)
// Valida os params (petId)
router.put(
  '/:petId/adopt',
  checkAuth,
  validateRequest(schemas.petIdSchema),
  petsController.markAsAdopted
);

// POST /api/pets/:petId/vaccines (Privado)
// Valida os params (petId) e o body da vacina
router.post(
  '/:petId/vaccines',
  checkAuth,
  validateRequest(schemas.addVaccineSchema),
  petsController.addVaccine
);

module.exports = router;