// backend/routes/auth.js
const router = require('express').Router();
const authController = require('../controllers/authController');
const checkAuth = require('../middleware/checkAuth');
const validateRequest = require('../middleware/validateRequest');
const { registerSchema, loginSchema, updateProfileSchema } = require('../schemas/authSchemas');

// --- Configuração do Multer (Upload) ---
const multer = require('multer');
// Usamos memoryStorage para enviar o buffer para o Supabase (como já estava)
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


// Rota -> Middleware de Upload -> Middleware de Validação -> Controlador
router.post(
  '/register',
  upload.single('photo'),
  validateRequest(registerSchema),
  authController.register
);

router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login
);

// Rotas protegidas (usam checkAuth)
router.get(
  '/me',
  checkAuth,
  authController.getMe
);

router.put(
  '/me',
  checkAuth,
  upload.single('photo'),
  validateRequest(updateProfileSchema),
  authController.updateMe
);

module.exports = router;