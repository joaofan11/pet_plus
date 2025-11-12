// backend/repositories/blogRepository.js
const db = require('../db');

/**
 * Busca todos os posts com informações do autor.
 * Note a vírgula corrigida na query original.
 */
const findAllPosts = async () => {
  const query = `
      SELECT p.id, p.content, p.location, 
             p.owner_id AS "ownerId", 
             p.photo_url AS "photoUrl", 
             p.created_at AS "createdAt", 
             u.name AS "ownerName",
             u.photo_url AS "ownerPhotoUrl"
      FROM posts p 
      JOIN users u ON p.owner_id = u.id 
      ORDER BY p.created_at DESC
  `;
  const { rows } = await db.query(query);
  return rows;
};

/**
 * Busca um post específico pelo ID.
 */
const findPostById = async (postId) => {
  const { rows } = await db.query('SELECT * FROM posts WHERE id = $1', [postId]);
  return rows[0];
};

/**
 * Busca todos os comentários de um post.
 */
const findCommentsForPost = async (postId) => {
  const query = `
      SELECT c.id, c.content, 
             c.post_id AS "postId", 
             c.owner_id AS "ownerId", 
             c.created_at AS "createdAt", 
             u.name AS "ownerName" 
      FROM comments c 
      JOIN users u ON c.owner_id = u.id 
      WHERE c.post_id = $1 
      ORDER BY c.created_at ASC
  `;
  const { rows } = await db.query(query, [postId]);
  return rows;
};

/**
 * Busca todos os user_id que curtiram um post.
 */
const findLikesForPost = async (postId) => {
  const query = 'SELECT user_id AS "userId" FROM likes WHERE post_id = $1';
  const { rows } = await db.query(query, [postId]);
  return rows.map(l => l.userId); // Retorna um array de IDs [1, 5, 12]
};

/**
 * Cria um novo post.
 */
const createPost = async (postData) => {
  const { ownerId, content, location, photoUrl } = postData;
  const query = `
      INSERT INTO posts (owner_id, content, location, photo_url) VALUES ($1, $2, $3, $4) 
      RETURNING id, content, location, 
                owner_id AS "ownerId", photo_url AS "photoUrl", created_at AS "createdAt"
  `;
  const { rows } = await db.query(query, [ownerId, content, location, photoUrl]);
  return rows[0];
};

/**
 * Atualiza um post.
 */
const updatePost = async (postId, ownerId, postData) => {
  const { content, location, photoUrl } = postData;
  const query = `
      UPDATE posts SET content=$1, location=$2, photo_url=$3 
      WHERE id = $4 AND owner_id = $5 
      RETURNING id, content, location, 
                owner_id AS "ownerId", photo_url AS "photoUrl", created_at AS "createdAt"
  `;
  const { rows } = await db.query(query, [content, location, photoUrl, postId, ownerId]);
  return rows[0];
};

/**
 * Deleta um post.
 */
const deletePost = async (postId, ownerId) => {
  const { rowCount } = await db.query(
    "DELETE FROM posts WHERE id = $1 AND owner_id = $2",
    [postId, ownerId]
  );
  return rowCount;
};

/**
 * Busca um like específico.
 */
const findLike = async (postId, userId) => {
  const { rows } = await db.query(
    "SELECT * FROM likes WHERE post_id = $1 AND user_id = $2",
    [postId, userId]
  );
  return rows[0];
};

/**
 * Adiciona um like.
 */
const addLike = async (postId, userId) => {
  await db.query(
    "INSERT INTO likes (post_id, user_id) VALUES ($1, $2)",
    [postId, userId]
  );
};

/**
 * Remove um like.
 */
const removeLike = async (postId, userId) => {
  await db.query(
    "DELETE FROM likes WHERE post_id = $1 AND user_id = $2",
    [postId, userId]
  );
};

/**
 * Adiciona um comentário.
 */
const addComment = async (postId, ownerId, content) => {
  const query = `
      INSERT INTO comments (post_id, owner_id, content) VALUES ($1, $2, $3) 
      RETURNING id, content, 
                post_id AS "postId", 
                owner_id AS "ownerId", 
                created_at AS "createdAt"
  `;
  const { rows } = await db.query(query, [postId, ownerId, content]);
  return rows[0];
};

module.exports = {
  findAllPosts,
  findPostById,
  findCommentsForPost,
  findLikesForPost,
  createPost,
  updatePost,
  deletePost,
  findLike,
  addLike,
  removeLike,
  addComment,
};