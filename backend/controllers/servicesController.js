<<<<<<< HEAD
// backend/controllers/servicesController.js
const servicesService = require('../services/servicesService');
const { sendResponse } = require('../utils/responseHandler');

// Wrapper para facilitar o tratamento de erros em rotas async
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllServices = catchAsync(async (req, res, next) => {
  // Passa o header de autorização para o service checar se o usuário está logado
  const authorizationHeader = req.headers.authorization;
  const services = await servicesService.getAllServices(req.query, authorizationHeader);
  sendResponse(res, 200, 'Serviços recuperados com sucesso.', services);
});

const createService = catchAsync(async (req, res, next) => {
  const newService = await servicesService.addNewService(req.userData.userId, req.body);
  sendResponse(res, 201, 'Serviço cadastrado com sucesso!', newService);
});

const updateService = catchAsync(async (req, res, next) => {
  const updatedService = await servicesService.updateServiceDetails(
    req.params.serviceId,
    req.userData.userId,
    req.body
  );
  sendResponse(res, 200, 'Serviço atualizado com sucesso!', updatedService);
});

const deleteService = catchAsync(async (req, res, next) => {
  await servicesService.deleteService(req.params.serviceId, req.userData.userId);
  sendResponse(res, 200, 'Serviço excluído com sucesso.');
});

module.exports = {
  getAllServices,
  createService,
  updateService,
  deleteService,
=======
// backend/controllers/servicesController.js
const servicesService = require('../services/servicesService');
const { sendResponse } = require('../utils/responseHandler');

// Wrapper para facilitar o tratamento de erros em rotas async
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllServices = catchAsync(async (req, res, next) => {
  // Passa o header de autorização para o service checar se o usuário está logado
  const authorizationHeader = req.headers.authorization;
  const services = await servicesService.getAllServices(req.query, authorizationHeader);
  sendResponse(res, 200, 'Serviços recuperados com sucesso.', services);
});

const createService = catchAsync(async (req, res, next) => {
  const newService = await servicesService.addNewService(req.userData.userId, req.body);
  sendResponse(res, 201, 'Serviço cadastrado com sucesso!', newService);
});

const updateService = catchAsync(async (req, res, next) => {
  const updatedService = await servicesService.updateServiceDetails(
    req.params.serviceId,
    req.userData.userId,
    req.body
  );
  sendResponse(res, 200, 'Serviço atualizado com sucesso!', updatedService);
});

const deleteService = catchAsync(async (req, res, next) => {
  await servicesService.deleteService(req.params.serviceId, req.userData.userId);
  sendResponse(res, 200, 'Serviço excluído com sucesso.');
});

module.exports = {
  getAllServices,
  createService,
  updateService,
  deleteService,
>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
};