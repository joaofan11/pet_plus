// backend/repositories/petsRepository.js
const db = require('../db');

/**
 * Busca pets para adoção com base em filtros.
 */
const findAdoptionPets = async (filters = {}) => {
  const { species, size, age, search } = filters;

  let query = `
      SELECT 
          p.id, p.name, p.species, p.breed, p.age, p.size, p.gender, p.type, p.status, p.description,
          p.owner_id AS "ownerId", 
          p.photo_url AS "photoUrl", 
          p.created_at AS "createdAt",
          u.name AS "ownerName", 
          u.phone AS "ownerPhone", 
          u.email AS "ownerEmail" 
      FROM pets p 
      JOIN users u ON p.owner_id = u.id 
      WHERE p.type = 'adoption' AND p.status = 'available'
  `;
  
  const params = [];
  if (species) { params.push(species); query += ` AND p.species = $${params.length}`; }
  if (size) { params.push(size); query += ` AND p.size = $${params.length}`; }
  if (age) { params.push(age); query += ` AND p.age = $${params.length}`; }
  if (search) { params.push(`%${search}%`); query += ` AND (p.name ILIKE $${params.length} OR p.breed ILIKE $${params.length})`; }
  query += " ORDER BY p.created_at DESC";
  
  const { rows } = await db.query(query, params);
  return rows;
};

/**
 * Busca todos os pets de um dono específico.
 */
const findPetsByOwner = async (ownerId) => {
  const query = `
      SELECT id, name, species, breed, age, size, gender, type, status, description,
           owner_id AS "ownerId", 
           photo_url AS "photoUrl", 
           created_at AS "createdAt"
      FROM pets WHERE owner_id = $1 ORDER BY created_at DESC
  `;
  const { rows } = await db.query(query, [ownerId]);
  return rows;
};

/**
 * Busca um pet específico pelo ID.
 */
const findPetById = async (petId) => {
    const query = `
        SELECT id, name, species, breed, age, size, gender, type, status, description,
             owner_id AS "ownerId", 
             photo_url AS "photoUrl", 
             created_at AS "createdAt"
        FROM pets WHERE id = $1
    `;
    const { rows } = await db.query(query, [petId]);
    return rows[0];
};

/**
 * Busca todas as vacinas de um pet.
 */
const findVaccinesForPet = async (petId) => {
    const query = `
        SELECT id, name, date, notes, vet, 
               pet_id AS "petId", 
               next_date AS "nextDate" 
        FROM vaccines WHERE pet_id = $1 ORDER BY date DESC
    `;
    const { rows } = await db.query(query, [petId]);
    return rows;
};

/**
 * Cria um novo pet no banco de dados.
 */
const createPet = async (petData) => {
  const { ownerId, name, species, breed, age, size, gender, type, status, description, photoUrl } = petData;
  const query = `
      INSERT INTO pets (owner_id, name, species, breed, age, size, gender, type, status, description, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING id, name, species, breed, age, size, gender, type, status, description,
                owner_id AS "ownerId", photo_url AS "photoUrl", created_at AS "createdAt"
  `;
  const { rows } = await db.query(query, [
    ownerId, name, species, breed, age, size, gender, type, status, description, photoUrl
  ]);
  return rows[0];
};

/**
 * Atualiza um pet existente.
 */
const updatePet = async (petId, petData) => {
  const { name, species, breed, age, size, gender, type, status, description, photoUrl, ownerId } = petData;
  const query = `
      UPDATE pets SET name=$1, species=$2, breed=$3, age=$4, size=$5, gender=$6, type=$7, status=$8, description=$9, photo_url=$10
      WHERE id = $11 AND owner_id = $12 
      RETURNING id, name, species, breed, age, size, gender, type, status, description,
                owner_id AS "ownerId", photo_url AS "photoUrl", created_at AS "createdAt"
  `;
  const { rows } = await db.query(query, [
    name, species, breed, age, size, gender, type, status, description, photoUrl, petId, ownerId
  ]);
  return rows[0];
};

/**
 * Deleta um pet do banco de dados.
 */
const deletePet = async (petId, ownerId) => {
  const { rowCount } = await db.query(
    "DELETE FROM pets WHERE id = $1 AND owner_id = $2",
    [petId, ownerId]
  );
  return rowCount;
};

/**
 * Atualiza o status de um pet (ex: para 'adopted').
 */
const updatePetStatus = async (petId, ownerId, status) => {
  const { rowCount } = await db.query(
    "UPDATE pets SET status = $1 WHERE id = $2 AND owner_id = $3",
    [status, petId, ownerId]
  );
  return rowCount;
};

/**
 * Adiciona uma nova vacina para um pet.
 */
const addVaccine = async (petId, vaccineData) => {
  const { name, date, nextDate, vet, notes } = vaccineData;
  const query = `
      INSERT INTO vaccines (pet_id, name, date, next_date, vet, notes)
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, name, date, notes, vet, 
                pet_id AS "petId", 
                next_date AS "nextDate"
  `;
  const { rows } = await db.query(query, [
    petId, name, date, nextDate || null, vet, notes
  ]);
  return rows[0];
};

module.exports = {
  findAdoptionPets,
  findPetsByOwner,
  findPetById,
  findVaccinesForPet,
  createPet,
  updatePet,
  deletePet,
  updatePetStatus,
  addVaccine,
};