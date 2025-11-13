const router = require('express').Router();
const authController = require('../controllers/authController');
const checkAuth = require('../middleware/checkAuth');
const validateRequest = require('../middleware/validateRequest');
const { registerSchema, updateProfileSchema } = require('../schemas/authSchemas');

const multer = require('multer');
const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
        cb(new Error('Formato de imagem não suportado (apenas JPG, PNG, WebP)'), false);
  }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

router.post(
  '/register',
  upload.single('photo'),
  validateRequest(registerSchema),
  authController.register
);

router.get( '/me',  checkAuth, authController.getMe);

router.put(
  '/me',
  checkAuth,
  upload.single('photo'),
  validateRequest(updateProfileSchema),
  authController.updateMe
);

module.exports = router;
