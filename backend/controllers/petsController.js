// backend/controllers/petsController.js
const petsService = require('../services/petsService');
const { sendResponse } = require('../utils/responseHandler');

// Wrapper para facilitar o tratamento de erros em rotas async
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllAdoption = catchAsync(async (req, res, next) => {
  const pets = await petsService.getAdoptionPets(req.query);
  sendResponse(res, 200, 'Pets para adoção recuperados com sucesso.', pets);
});

const getMyPets = catchAsync(async (req, res, next) => {
  const pets = await petsService.getMyPets(req.userData.userId);
  sendResponse(res, 200, 'Seus pets foram recuperados com sucesso.', pets);
});

const createPet = catchAsync(async (req, res, next) => {
  const newPet = await petsService.addNewPet(req.userData.userId, req.body, req.file);
  sendResponse(res, 201, 'Pet cadastrado com sucesso!', newPet);
});

const updatePet = catchAsync(async (req, res, next) => {
  const updatedPet = await petsService.updatePetDetails(
    req.params.petId,
    req.userData.userId,
    req.body,
    req.file
  );
  sendResponse(res, 200, 'Pet atualizado com sucesso!', updatedPet);
});

const deletePet = catchAsync(async (req, res, next) => {
  await petsService.deletePet(req.params.petId, req.userData.userId);
  sendResponse(res, 200, 'Pet excluído com sucesso.');
});

const markAsAdopted = catchAsync(async (req, res, next) => {
  await petsService.markPetAsAdopted(req.params.petId, req.userData.userId);
  sendResponse(res, 200, 'Pet marcado como adotado!');
});

const addVaccine = catchAsync(async (req, res, next) => {
  const newVaccine = await petsService.addVaccineToPet(
    req.params.petId,
    req.userData.userId,
    req.body
  );
  sendResponse(res, 201, 'Vacina adicionada com sucesso!', newVaccine);
});

module.exports = {
  getAllAdoption,
  getMyPets,
  createPet,
  updatePet,
  deletePet,
  markAsAdopted,
  addVaccine,
};