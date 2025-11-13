// backend/controllers/authController.js
const authService = require('../services/authService');
const authRepository = require('../repositories/authRepository'); // Necessário para pegar dados atuais
const { sendResponse } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errors');

// Wrapper para facilitar o tratamento de erros em rotas async
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const register = catchAsync(async (req, res, next) => {
  // A validação já ocorreu no middleware validateRequest
  const user = await authService.registerUser(req.body, req.file);
  sendResponse(res, 201, 'Cadastro realizado com sucesso!', user);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const data = await authService.loginUser(email, password);
  sendResponse(res, 200, `Bem-vindo(a), ${data.user.name}!`, data);
});

const getMe = catchAsync(async (req, res, next) => {
  // req.userData é injetado pelo middleware checkAuth
  const user = await authService.getUserProfile(req.userData.userId);
  sendResponse(res, 200, 'Perfil recuperado com sucesso.', user);
});

const updateMe = catchAsync(async (req, res, next) => {
    const { userId } = req.userData;
    
    // Precisamos dos dados atuais do usuário para comparar
    const currentUser = await authRepository.findUserById(userId);
    if (!currentUser) {
        throw new NotFoundError('Usuário não encontrado.'); // Deve ser raro, pois ele está logado
    }

    const updatedUser = await authService.updateUserProfile(
        userId,
        currentUser, 
        req.body, 
        req.file
    );
    
    sendResponse(res, 200, 'Perfil atualizado com sucesso!', updatedUser);
});

module.exports = {
  register,
  login,
  getMe,
  updateMe
};