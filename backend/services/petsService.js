// backend/services/petsService.js
const petsRepository = require('../repositories/petsRepository');
const { uploadFile } = require('../supabaseClient'); // Usando Supabase
const { ForbiddenError, NotFoundError, AppError } = require('../utils/errors');

/**
 * Busca pets para adoção e anexa suas vacinas.
 */
const getAdoptionPets = async (filters) => {
  const pets = await petsRepository.findAdoptionPets(filters);
  // Anexa as vacinas a cada pet
  for (const pet of pets) {
    pet.vaccines = await petsRepository.findVaccinesForPet(pet.id);
  }
  return pets;
};

/**
 * Busca os pets de um usuário e anexa suas vacinas.
 */
const getMyPets = async (ownerId) => {
  const pets = await petsRepository.findPetsByOwner(ownerId);
  // Anexa as vacinas a cada pet
  for (const pet of pets) {
    pet.vaccines = await petsRepository.findVaccinesForPet(pet.id);
  }
  return pets;
};

/**
 * Lida com a lógica de criar um novo pet, incluindo upload de foto.
 */
const addNewPet = async (ownerId, petData, file) => {
  let photoUrl = null;
  if (file) {
    try {
      photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
    } catch (uploadError) {
      console.error(uploadError);
      throw new AppError('Erro ao fazer upload da foto do pet.', 500);
    }
  }

  const status = (petData.type === 'adoption') ? 'available' : 'personal';

  const newPetData = {
    ...petData,
    ownerId,
    status,
    photoUrl,
  };

  const newPet = await petsRepository.createPet(newPetData);
  newPet.vaccines = []; // Novo pet começa sem vacinas
  return newPet;
};

/**
 * Lida com a lógica de atualizar um pet, checando permissão e upload.
 */
const updatePetDetails = async (petId, ownerId, updateData, file) => {
  const pet = await petsRepository.findPetById(petId);
  if (!pet) {
    throw new NotFoundError('Pet não encontrado.');
  }
  // Checagem de permissão
  if (pet.ownerId !== ownerId) {
    throw new ForbiddenError('Você não tem permissão para editar este pet.');
  }

  let photoUrl = updateData.photoUrl || pet.photoUrl; // Mantém a foto antiga

  if (file) {
    try {
      photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
      // TODO: Adicionar lógica para deletar a foto antiga do Supabase
    } catch (uploadError) {
      console.error(uploadError);
      throw new AppError('Erro ao fazer upload da nova foto do pet.', 500);
    }
  }

  const newStatus = (updateData.type === 'adoption') ? 'available' : (updateData.type === 'personal') ? 'personal' : pet.status;

  const finalPetData = {
    name: updateData.name || pet.name,
    species: updateData.species || pet.species,
    breed: updateData.breed || pet.breed,
    age: updateData.age || pet.age,
    size: updateData.size || pet.size,
    gender: updateData.gender || pet.gender,
    type: updateData.type || pet.type,
    description: updateData.description || pet.description,
    status: newStatus,
    photoUrl: photoUrl,
    ownerId: ownerId, // Garante que o ownerId não mude
  };

  const updatedPet = await petsRepository.updatePet(petId, finalPetData);
  return updatedPet;
};

/**
 * Deleta um pet, checando a permissão no nível do repositório.
 */
const deletePet = async (petId, ownerId) => {
  const rowCount = await petsRepository.deletePet(petId, ownerId);
  if (rowCount === 0) {
    throw new NotFoundError('Pet não encontrado ou você não tem permissão.');
  }
};

/**
 * Marca um pet como 'adotado', checando a permissão.
 */
const markPetAsAdopted = async (petId, ownerId) => {
  const rowCount = await petsRepository.updatePetStatus(petId, ownerId, 'adopted');
  if (rowCount === 0) {
    throw new NotFoundError('Pet não encontrado ou você não tem permissão.');
  }
};

/**
 * Adiciona uma vacina, checando a permissão do dono primeiro.
 */
const addVaccineToPet = async (petId, ownerId, vaccineData) => {
  const pet = await petsRepository.findPetById(petId);
  if (!pet) {
    throw new NotFoundError('Pet não encontrado.');
  }
  // Checagem de permissão
  if (pet.ownerId !== ownerId) {
    throw new ForbiddenError('Você não tem permissão para adicionar vacinas a este pet.');
  }

  const newVaccine = await petsRepository.addVaccine(petId, vaccineData);
  return newVaccine;
};

module.exports = {
  getAdoptionPets,
  getMyPets,
  addNewPet,
  updatePetDetails,
  deletePet,
  markPetAsAdopted,
  addVaccineToPet,
};