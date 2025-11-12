// backend/repositories/authRepository.js
const db = require('../db');

/**
 * Encontra um usuário pelo email.
 * @param {string} email - O email do usuário.
 * @returns {Promise<Object | undefined>} O usuário (com campos em camelCase) ou undefined.
 */
const findUserByEmail = async (email) => {
  const { rows } = await db.query(
    `SELECT 
       id, name, email, phone, password_hash AS "passwordHash", photo_url AS "photoUrl" 
     FROM users 
     WHERE email = $1`,
    [email]
  );
  return rows[0];
};

/**
 * Encontra um usuário pelo ID (PK).
 * @param {number} userId - O ID da tabela 'users'.
 * @returns {Promise<Object | undefined>} O usuário (sem dados sensíveis) ou undefined.
 */
const findUserById = async (userId) => {
  const { rows } = await db.query(
    'SELECT id, name, email, phone, photo_url AS "photoUrl" FROM users WHERE id = $1',
    [userId]
  );
  return rows[0];
};

/**
 * Cria um novo usuário no banco de dados.
 * @param {string} name - Nome do usuário.
 * @param {string} email - Email do usuário.
 * @param {string} phone - Telefone do usuário.
 * @param {string} passwordHash - Hash da senha.
 * @param {string | null} photoUrl - URL da foto (pode ser nula).
 * @returns {Promise<Object>} O novo usuário criado.
 */
const createUser = async (name, email, phone, passwordHash, photoUrl) => {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, phone, password_hash, photo_url) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, name, email, phone, photo_url AS "photoUrl"`,
    [name, email, phone, passwordHash, photoUrl]
  );
  return rows[0];
};

/**
 * Atualiza os dados de um usuário no banco.
 * @param {number} userId - ID do usuário a ser atualizado.
 *M @param {string} name - Novo nome.
 * @param {string} email - Novo email.
 * @param {string} phone - Novo telefone.
 * @param {string | null} photoUrl - Nova URL da foto.
 * @returns {Promise<Object>} O usuário atualizado.
 */
const updateUser = async (userId, name, email, phone, photoUrl) => {
    const { rows } = await db.query(
        `UPDATE users 
         SET name = $1, email = $2, phone = $3, photo_url = $4 
         WHERE id = $5
         RETURNING id, name, email, phone, photo_url AS "photoUrl"`,
        [name, email, phone, photoUrl, userId]
    );
    return rows[0];
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser
};