// backend/repositories/servicesRepository.js
const db = require('../db');

/**
 * Busca todos os serviços com base em filtros, incluindo dados do dono.
 */
const findAllServices = async (filters = {}) => {
  const { category, search } = filters;
  
  let query = `
      SELECT 
          s.id, s.category, s.name, s.professional, s.phone, s.address, s.description, s.latitude, s.longitude,
          s.owner_id AS "ownerId", 
          s.created_at AS "createdAt", 
          u.name AS "ownerName" 
      FROM services s 
      JOIN users u ON s.owner_id = u.id 
      WHERE 1=1
  `;
  const params = [];

  if (category) { params.push(category); query += ` AND s.category = $${params.length}`; }
  if (search) { params.push(`%${search}%`); query += ` AND (s.name ILIKE $${params.length} OR s.professional ILIKE $${params.length} OR s.address ILIKE $${params.length})`; }
  query += " ORDER BY s.created_at DESC";

  const { rows } = await db.query(query, params);
  return rows;
};

/**
 * Busca um serviço específico pelo ID.
 */
const findServiceById = async (serviceId) => {
  const query = `
      SELECT * FROM services WHERE id = $1
  `;
  const { rows } = await db.query(query, [serviceId]);
  return rows[0]; // Retorna o serviço com snake_case (owner_id)
};

/**
 * Cria um novo serviço no banco de dados.
 */
const createService = async (serviceData) => {
  const { ownerId, category, name, professional, phone, address, description, latitude, longitude } = serviceData;
  const query = `
      INSERT INTO services (owner_id, category, name, professional, phone, address, description, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id, category, name, professional, phone, address, description, latitude, longitude,
                owner_id AS "ownerId", created_at AS "createdAt"
  `;
  const { rows } = await db.query(query, [
    ownerId, category, name, professional, phone, address, description, latitude || null, longitude || null
  ]);
  return rows[0];
};

/**
 * Atualiza um serviço existente.
 */
const updateService = async (serviceId, ownerId, serviceData) => {
  const { category, name, professional, phone, address, description, latitude, longitude } = serviceData;
  const query = `
      UPDATE services SET category=$1, name=$2, professional=$3, phone=$4, address=$5, description=$6, latitude=$7, longitude=$8
      WHERE id = $9 AND owner_id = $10 
      RETURNING id, category, name, professional, phone, address, description, latitude, longitude,
                owner_id AS "ownerId", created_at AS "createdAt"
  `;
  const { rows } = await db.query(query, [
    category, name, professional, phone, address, description, latitude || null, longitude || null, serviceId, ownerId
  ]);
  return rows[0];
};

/**
 * Deleta um serviço do banco de dados.
 */
const deleteService = async (serviceId, ownerId) => {
  const { rowCount } = await db.query(
    "DELETE FROM services WHERE id = $1 AND owner_id = $2",
    [serviceId, ownerId]
  );
  return rowCount;
};

module.exports = {
  findAllServices,
  findServiceById,
  createService,
  updateService,
  deleteService,
};