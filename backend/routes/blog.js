// backend/routes/blog.js

// Módulos Nativos/Terceiros
const router = require('express').Router();

// Módulos Locais (Middleware)
const checkAuth = require('../middleware/checkAuth');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../config/multer'); // Importa a config centralizada

// Módulos Locais (Controllers e Schemas)
const blogController = require('../controllers/blogController');
const schemas = require('../schemas/blogSchemas');

// --- Rotas de Blog ---

// GET /api/blog (Público)
router.get('/', blogController.getAllPosts);

// POST /api/blog (Privado)
router.post(
  '/',
  checkAuth,
  upload.single('photo'), // Usa a instância centralizada
  validateRequest(schemas.createPostSchema),
  blogController.createPost
);

// PUT /api/blog/:postId (Privado)
router.put(
  '/:postId',
  checkAuth,
  upload.single('photo'), // Usa a instância centralizada
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