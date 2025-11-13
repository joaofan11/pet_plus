<<<<<<< HEAD
// backend/services/servicesService.js
const servicesRepository = require('../repositories/servicesRepository');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

/**
 * Busca todos os serviços e censura dados se o usuário não estiver logado.
 */
const getAllServices = async (filters, authorizationHeader) => {
  const services = await servicesRepository.findAllServices(filters);
  
  // A lógica original (routes/services.js) verifica apenas se o header *existe*.
  // O frontend (script.js) só envia o header se `currentUser` existir.
  // Esta lógica está correta para o propósito de "esconder" o contato.
  const isAuth = authorizationHeader && authorizationHeader.startsWith('Bearer ');

  if (isAuth) {
    // Usuário logado, retorna tudo
    return services;
  }

  // Usuário não logado, censura os dados
  const censoredServices = services.map(service => {
    return {
      ...service,
      phone: "Faça login para ver",
      address: "Faça login para ver",
      latitude: null,
      longitude: null,
      // Mantém os outros campos: id, category, name, professional, description, ownerId, etc.
    };
  });
  
  return censoredServices;
};

/**
 * Adiciona um novo serviço.
 */
const addNewService = async (ownerId, serviceData) => {
  const newServiceData = {
    ...serviceData,
    ownerId,
  };
  const newService = await servicesRepository.createService(newServiceData);
  return newService;
};

/**
 * Atualiza os detalhes de um serviço, checando a permissão.
 */
const updateServiceDetails = async (serviceId, ownerId, updateData) => {
  const service = await servicesRepository.findServiceById(serviceId);
  if (!service) {
    throw new NotFoundError('Serviço não encontrado.');
  }
  // Checagem de permissão
  if (service.owner_id !== ownerId) {
    throw new ForbiddenError('Você não tem permissão para editar este serviço.');
  }

  // Mescla dados antigos com os novos
  const finalServiceData = {
    category: updateData.category || service.category,
    name: updateData.name || service.name,
    professional: updateData.professional || service.professional,
    phone: updateData.phone || service.phone,
    address: updateData.address || service.address,
    description: updateData.description || service.description,
    latitude: updateData.latitude || service.latitude,
    longitude: updateData.longitude || service.longitude,
  };

  const updatedService = await servicesRepository.updateService(serviceId, ownerId, finalServiceData);
  return updatedService;
};

/**
 * Deleta um serviço, checando a permissão no nível do repositório.
 */
const deleteService = async (serviceId, ownerId) => {
  const rowCount = await servicesRepository.deleteService(serviceId, ownerId);
  if (rowCount === 0) {
    throw new NotFoundError('Serviço não encontrado ou você não tem permissão.');
  }
};

module.exports = {
  getAllServices,
  addNewService,
  updateServiceDetails,
  deleteService,
=======
// backend/services/servicesService.js
const servicesRepository = require('../repositories/servicesRepository');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

/**
 * Busca todos os serviços e censura dados se o usuário não estiver logado.
 */
const getAllServices = async (filters, authorizationHeader) => {
  const services = await servicesRepository.findAllServices(filters);
  
  // A lógica original (routes/services.js) verifica apenas se o header *existe*.
  // O frontend (script.js) só envia o header se `currentUser` existir.
  // Esta lógica está correta para o propósito de "esconder" o contato.
  const isAuth = authorizationHeader && authorizationHeader.startsWith('Bearer ');

  if (isAuth) {
    // Usuário logado, retorna tudo
    return services;
  }

  // Usuário não logado, censura os dados
  const censoredServices = services.map(service => {
    return {
      ...service,
      phone: "Faça login para ver",
      address: "Faça login para ver",
      latitude: null,
      longitude: null,
      // Mantém os outros campos: id, category, name, professional, description, ownerId, etc.
    };
  });
  
  return censoredServices;
};

/**
 * Adiciona um novo serviço.
 */
const addNewService = async (ownerId, serviceData) => {
  const newServiceData = {
    ...serviceData,
    ownerId,
  };
  const newService = await servicesRepository.createService(newServiceData);
  return newService;
};

/**
 * Atualiza os detalhes de um serviço, checando a permissão.
 */
const updateServiceDetails = async (serviceId, ownerId, updateData) => {
  const service = await servicesRepository.findServiceById(serviceId);
  if (!service) {
    throw new NotFoundError('Serviço não encontrado.');
  }
  // Checagem de permissão
  if (service.owner_id !== ownerId) {
    throw new ForbiddenError('Você não tem permissão para editar este serviço.');
  }

  // Mescla dados antigos com os novos
  const finalServiceData = {
    category: updateData.category || service.category,
    name: updateData.name || service.name,
    professional: updateData.professional || service.professional,
    phone: updateData.phone || service.phone,
    address: updateData.address || service.address,
    description: updateData.description || service.description,
    latitude: updateData.latitude || service.latitude,
    longitude: updateData.longitude || service.longitude,
  };

  const updatedService = await servicesRepository.updateService(serviceId, ownerId, finalServiceData);
  return updatedService;
};

/**
 * Deleta um serviço, checando a permissão no nível do repositório.
 */
const deleteService = async (serviceId, ownerId) => {
  const rowCount = await servicesRepository.deleteService(serviceId, ownerId);
  if (rowCount === 0) {
    throw new NotFoundError('Serviço não encontrado ou você não tem permissão.');
  }
};

module.exports = {
  getAllServices,
  addNewService,
  updateServiceDetails,
  deleteService,
>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
};