<<<<<<< HEAD
// backend/routes/services.js
const router = require('express').Router();
const servicesController = require('../controllers/servicesController');
const checkAuth = require('../middleware/checkAuth');
const validateRequest = require('../middleware/validateRequest');
const schemas = require('../schemas/servicesSchemas');

// --- Rotas de Serviços ---

// GET /api/services (Público, mas com lógica de censura)
// Valida os query params
router.get(
  '/',
  validateRequest(schemas.getServicesSchema),
  servicesController.getAllServices
);

// POST /api/services (Privado)
// Aplica auth e validação do body
router.post(
  '/',
  checkAuth,
  validateRequest(schemas.createServiceSchema),
  servicesController.createService
);

// PUT /api/services/:serviceId (Privado)
// Valida params e body
router.put(
  '/:serviceId',
  checkAuth,
  validateRequest(schemas.updateServiceSchema),
  servicesController.updateService
);

// DELETE /api/services/:serviceId (Privado)
// Valida params
router.delete(
  '/:serviceId',
  checkAuth,
  validateRequest(schemas.serviceIdSchema),
  servicesController.deleteService
);

=======
// backend/routes/services.js
const router = require('express').Router();
const servicesController = require('../controllers/servicesController');
const checkAuth = require('../middleware/checkAuth');
const validateRequest = require('../middleware/validateRequest');
const schemas = require('../schemas/servicesSchemas');

// --- Rotas de Serviços ---

// GET /api/services (Público, mas com lógica de censura)
// Valida os query params
router.get(
  '/',
  validateRequest(schemas.getServicesSchema),
  servicesController.getAllServices
);

// POST /api/services (Privado)
// Aplica auth e validação do body
router.post(
  '/',
  checkAuth,
  validateRequest(schemas.createServiceSchema),
  servicesController.createService
);

// PUT /api/services/:serviceId (Privado)
// Valida params e body
router.put(
  '/:serviceId',
  checkAuth,
  validateRequest(schemas.updateServiceSchema),
  servicesController.updateService
);

// DELETE /api/services/:serviceId (Privado)
// Valida params
router.delete(
  '/:serviceId',
  checkAuth,
  validateRequest(schemas.serviceIdSchema),
  servicesController.deleteService
);

>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
module.exports = router;