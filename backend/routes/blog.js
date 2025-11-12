// backend/routes/blog.js
const router = require('express').Router();
const blogController = require('../controllers/blogController');
const checkAuth = require('../middleware/checkAuth');
const validateRequest = require('../middleware/validateRequest');
const schemas = require('../schemas/blogSchemas');

// --- Configuração do Multer (Upload de Imagem) ---
// Usando memoryStorage para integração com Supabase
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
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
});
// --- Fim da Configuração do Multer ---


// GET /api/blog (Público)
router.get('/', blogController.getAllPosts);

// POST /api/blog (Privado)
router.post(
  '/',
  checkAuth,
  upload.single('photo'),
  validateRequest(schemas.createPostSchema),
  blogController.createPost
);

// PUT /api/blog/:postId (Privado)
router.put(
  '/:postId',
  checkAuth,
  upload.single('photo'),
  validateRequest(schemas.updatePostSchema),
  blogController.updatePost
);

// DELETE /api/blog/:postId (Privado)
router.delete(
  '/:postId',
  checkAuth,
  validateRequest(schemas.postIdSchema),
  blogController.deletePost
);

// POST /api/blog/:postId/like (Privado)
router.post(
  '/:postId/like',
  checkAuth,
  validateRequest(schemas.postIdSchema),
  blogController.toggleLike
);

// POST /api/blog/:postId/comment (Privado)
router.post(
  '/:postId/comment',
  checkAuth,
  validateRequest(schemas.createCommentSchema),
  blogController.createComment
);

module.exports = router;