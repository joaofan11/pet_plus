<<<<<<< HEAD
// backend/services/blogService.js
const blogRepository = require('../repositories/blogRepository');
const { uploadFile } = require('../supabaseClient');
const { ForbiddenError, NotFoundError, AppError } = require('../utils/errors');

/**
 * Busca todos os posts e anexa seus comentários e likes.
 * Otimizado com Promise.all para evitar gargalos sequenciais.
 */
const getAllPosts = async (filters = {}) => {
  // Busca os posts paginados do repositório
  const result = await blogRepository.findAllPosts(filters);
  
  // Acessa o array de posts dentro de 'data'
  const posts = result.data;

  // Otimização: Executa as buscas de comentários e likes em PARALELO para todos os posts
  await Promise.all(posts.map(async (post) => {
    const [comments, likes] = await Promise.all([
      blogRepository.findCommentsForPost(post.id),
      blogRepository.findLikesForPost(post.id)
    ]);
    
    post.comments = comments;
    post.likes = likes;
  }));

  // Retorna a estrutura completa com metadados de paginação (data, total, page, totalPages)
  return result;
};

/**
 * Adiciona um novo post, lidando com o upload de foto.
 */
const addNewPost = async (ownerData, postData, file) => {
  const { userId, name, photoUrl: ownerPhotoUrl } = ownerData;
  
  let photoUrl = null;
  if (file) {
    try {
      photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
    } catch (uploadError) {
      console.error(uploadError);
      throw new AppError('Erro ao fazer upload da foto do post.', 500);
    }
  }

  const newPostData = {
    ...postData,
    ownerId: userId,
    photoUrl,
  };

  const newPost = await blogRepository.createPost(newPostData);
  
  return {
    ...newPost,
    ownerName: name,
    ownerPhotoUrl: ownerPhotoUrl,
    comments: [],
    likes: [],
  };
};

/**
 * Atualiza um post, checando permissão e upload.
 */
const updatePostDetails = async (postId, ownerId, updateData, file) => {
  const post = await blogRepository.findPostById(postId);
  if (!post) {
    throw new NotFoundError('Post não encontrado.');
  }
  
  if (post.owner_id !== ownerId) {
    throw new ForbiddenError('Você não tem permissão para editar este post.');
  }

  let photoUrl = updateData.photoUrl || post.photo_url;

  if (file) {
    try {
      photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
    } catch (uploadError) {
      console.error(uploadError);
      throw new AppError('Erro ao fazer upload da nova foto do post.', 500);
    }
  }

  const finalPostData = {
    content: updateData.content || post.content,
    location: updateData.location || post.location,
    photoUrl: photoUrl,
  };

  const updatedPost = await blogRepository.updatePost(postId, ownerId, finalPostData);
  return updatedPost;
};

/**
 * Deleta um post.
 */
const deletePost = async (postId, ownerId) => {
  const rowCount = await blogRepository.deletePost(postId, ownerId);
  if (rowCount === 0) {
    throw new NotFoundError('Post não encontrado ou você não tem permissão.');
  }
};

/**
 * Adiciona ou remove um like de um post.
 */
const togglePostLike = async (postId, userId) => {
  const existingLike = await blogRepository.findLike(postId, userId);
  
  if (existingLike) {
    await blogRepository.removeLike(postId, userId);
    return { message: 'Like removido' };
  } else {
    await blogRepository.addLike(postId, userId);
    return { message: 'Like adicionado' };
  }
};

/**
 * Adiciona um comentário a um post.
 */
const addCommentToPost = async (postId, ownerData, content) => {
  const { userId, name } = ownerData;
  const newComment = await blogRepository.addComment(postId, userId, content);
  
  return {
    ...newComment,
    ownerName: name,
  };
};

module.exports = {
  getAllPosts,
  addNewPost,
  updatePostDetails,
  deletePost,
  togglePostLike,
  addCommentToPost,
=======
// backend/services/blogService.js
const blogRepository = require('../repositories/blogRepository');
const { uploadFile } = require('../supabaseClient');
const { ForbiddenError, NotFoundError, AppError } = require('../utils/errors');

/**
 * Busca todos os posts e anexa seus comentários e likes.
 * Otimizado com Promise.all para evitar gargalos sequenciais.
 */
const getAllPosts = async (filters = {}) => {
  // Busca os posts paginados do repositório
  const result = await blogRepository.findAllPosts(filters);
  
  // Acessa o array de posts dentro de 'data'
  const posts = result.data;

  // Otimização: Executa as buscas de comentários e likes em PARALELO para todos os posts
  await Promise.all(posts.map(async (post) => {
    const [comments, likes] = await Promise.all([
      blogRepository.findCommentsForPost(post.id),
      blogRepository.findLikesForPost(post.id)
    ]);
    
    post.comments = comments;
    post.likes = likes;
  }));

  // Retorna a estrutura completa com metadados de paginação (data, total, page, totalPages)
  return result;
};

/**
 * Adiciona um novo post, lidando com o upload de foto.
 */
const addNewPost = async (ownerData, postData, file) => {
  const { userId, name, photoUrl: ownerPhotoUrl } = ownerData;
  
  let photoUrl = null;
  if (file) {
    try {
      photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
    } catch (uploadError) {
      console.error(uploadError);
      throw new AppError('Erro ao fazer upload da foto do post.', 500);
    }
  }

  const newPostData = {
    ...postData,
    ownerId: userId,
    photoUrl,
  };

  const newPost = await blogRepository.createPost(newPostData);
  
  return {
    ...newPost,
    ownerName: name,
    ownerPhotoUrl: ownerPhotoUrl,
    comments: [],
    likes: [],
  };
};

/**
 * Atualiza um post, checando permissão e upload.
 */
const updatePostDetails = async (postId, ownerId, updateData, file) => {
  const post = await blogRepository.findPostById(postId);
  if (!post) {
    throw new NotFoundError('Post não encontrado.');
  }
  
  if (post.owner_id !== ownerId) {
    throw new ForbiddenError('Você não tem permissão para editar este post.');
  }

  let photoUrl = updateData.photoUrl || post.photo_url;

  if (file) {
    try {
      photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
    } catch (uploadError) {
      console.error(uploadError);
      throw new AppError('Erro ao fazer upload da nova foto do post.', 500);
    }
  }

  const finalPostData = {
    content: updateData.content || post.content,
    location: updateData.location || post.location,
    photoUrl: photoUrl,
  };

  const updatedPost = await blogRepository.updatePost(postId, ownerId, finalPostData);
  return updatedPost;
};

/**
 * Deleta um post.
 */
const deletePost = async (postId, ownerId) => {
  const rowCount = await blogRepository.deletePost(postId, ownerId);
  if (rowCount === 0) {
    throw new NotFoundError('Post não encontrado ou você não tem permissão.');
  }
};

/**
 * Adiciona ou remove um like de um post.
 */
const togglePostLike = async (postId, userId) => {
  const existingLike = await blogRepository.findLike(postId, userId);
  
  if (existingLike) {
    await blogRepository.removeLike(postId, userId);
    return { message: 'Like removido' };
  } else {
    await blogRepository.addLike(postId, userId);
    return { message: 'Like adicionado' };
  }
};

/**
 * Adiciona um comentário a um post.
 */
const addCommentToPost = async (postId, ownerData, content) => {
  const { userId, name } = ownerData;
  const newComment = await blogRepository.addComment(postId, userId, content);
  
  return {
    ...newComment,
    ownerName: name,
  };
};

module.exports = {
  getAllPosts,
  addNewPost,
  updatePostDetails,
  deletePost,
  togglePostLike,
  addCommentToPost,
>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
};