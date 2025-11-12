// backend/controllers/blogController.js
const blogService = require('../services/blogService');
const { sendResponse } = require('../utils/responseHandler');

// Wrapper para facilitar o tratamento de erros em rotas async
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllPosts = catchAsync(async (req, res, next) => {
  const posts = await blogService.getAllPosts();
  sendResponse(res, 200, 'Posts recuperados com sucesso.', posts);
});

const createPost = catchAsync(async (req, res, next) => {
  // req.userData (do checkAuth) tem { userId, name, email, photoUrl }
  const newPost = await blogService.addNewPost(req.userData, req.body, req.file);
  sendResponse(res, 201, 'Post criado com sucesso!', newPost);
});

const updatePost = catchAsync(async (req, res, next) => {
  const updatedPost = await blogService.updatePostDetails(
    req.params.postId,
    req.userData.userId,
    req.body,
    req.file
  );
  sendResponse(res, 200, 'Post atualizado com sucesso!', updatedPost);
});

const deletePost = catchAsync(async (req, res, next) => {
  await blogService.deletePost(req.params.postId, req.userData.userId);
  sendResponse(res, 200, 'Post excluído com sucesso.');
});

const toggleLike = catchAsync(async (req, res, next) => {
  const result = await blogService.togglePostLike(req.params.postId, req.userData.userId);
  sendResponse(res, 200, result.message);
});

const createComment = catchAsync(async (req, res, next) => {
  const newComment = await blogService.addCommentToPost(
    req.params.postId,
    req.userData,
    req.body.content
  );
  sendResponse(res, 201, 'Comentário adicionado com sucesso!', newComment);
});

module.exports = {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  createComment,
};