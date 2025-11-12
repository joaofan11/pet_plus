// backend/repositories/authRepository.js
const db = require('../db');

const findUserByEmail = async (email) => {
  const { rows } = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0];
};

const findUserById = async (userId) => {
  const { rows } = await db.query(
    'SELECT id, name, email, phone, photo_url AS "photoUrl" FROM users WHERE id = $1',
    [userId]
  );
  return rows[0];
};

const createUser = async (name, email, phone, passwordHash, photoUrl) => {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, phone, password_hash, photo_url) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, name, email, phone, photo_url AS "photoUrl"`,
    [name, email, phone, passwordHash, photoUrl]
  );
  return rows[0];
};

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